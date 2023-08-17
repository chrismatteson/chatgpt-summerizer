import { HandleRequest, HttpRequest, HttpResponse, Kv, Config, Sqlite} from "@fermyon/spin-sdk"
import { Configuration, CreateCompletionRequest, OpenAIApi } from "@ericlewis/openai";

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export const handleRequest: HandleRequest = async function(request: HttpRequest): Promise<HttpResponse> {
  let openai_key = ""
  if ( Config.get("openai_key") == "kv" ) {
    let kv = Kv.openDefault();
    console.log("no config for openai_key, using kv")
    openai_key = decoder.decode(kv.get("openai_key"))
  } else {
    openai_key = Config.get("openai_key")
  }
  let auth_token = ""
  if ( Config.get("auth_token") == "kv" ) {
    let kv = Kv.openDefault();
    console.log("no config for auth_token, using kv")
    auth_token = decoder.decode(kv.get("auth_token"))
  } else {
    console.log("update auth_token from kv")
    auth_token = Config.get("auth_token")
  }
  const request_token = request.headers["x-commonroom-webhook-secret"]
  if (request_token != auth_token) {
    console.log("Provided token "+request_token+" does not match configuration.")
    return { status: 500, body: encoder.encode("Invalid Auth Token").buffer }
  } else {
    console.log("auth_token verified")
  }
  let configuration = new Configuration({
    apiKey: openai_key,
  })
  let openai = new OpenAIApi(configuration);
  //Get activity from database per user
  const conn = Sqlite.openDefault();
  const users = conn.execute("SELECT DISTINCT primaryEmail FROM activity as JSON", [])
  console.log(users["rows"])

  const query = `
  INSERT INTO template
    (primaryEmail, response)
  VALUES
    (?, ?)
  `;

  for (var u of users["rows"]) {
    const user = u[0]!
    console.log("Getting activity for user " + user)
    const activity = conn.execute("SELECT * FROM activity WHERE primaryEmail = (?)", [user])
  
    let prompt = "Summarize the following sql formated information in the content column into a sentence fragment which could replace {interestingTidbit} in the following sentence: 'I noticed you {interestingTidbit}'. Return one or more complete sentences, ensure to include the value(s) from serviceName column as part of your answer. For example a complete sentence might be: 'I noticed you posted in Discord regarding using Spin with S3.' Do not just return this example prompt." + "\n" + JSON.stringify(activity)
    console.log(prompt)
    try {
      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{role: "user", content: prompt}]
      })
      let text = completion.data.choices[0].message
      const responseContent = JSON.parse(JSON.stringify(text))["content"]
      console.log(responseContent)
      conn.execute(query, [user, responseContent])
      const template = conn.execute("SELECT * FROM template WHERE primaryEmail = (?)", [user])
      console.log("Inserted template into database")
      console.log(template)
      conn.execute("DELETE FROM activity WHERE primaryEmail = (?)", [user])
      console.log("Deleted activity entries from " + user)
    } catch (err) {
      console.log(JSON.stringify(err));
      return { status: 500, body: encoder.encode("You might want to ask ChatGPT to fix this...").buffer }
    }
  }
  return {
    status: 200
  }
}
