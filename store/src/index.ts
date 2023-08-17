import { HandleRequest, HttpRequest, HttpResponse, Kv, Config, Sqlite} from "@fermyon/spin-sdk"

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export const handleRequest: HandleRequest = async function(request: HttpRequest): Promise<HttpResponse> {
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

  //Decode bode
  let decodedBody = JSON.parse(decoder.decode(request.body))
  let id = decodedBody.id
  let timestamp = decodedBody.payload.timestamp
  let serviceName = decodedBody.payload.serviceName
  let activityType = decodedBody.payload.activityType
  let content = decodedBody.payload.content
  let primaryEmail = decodedBody.payload.member.primaryEmail

  //Save request to database
  const conn = Sqlite.openDefault();
  try {
    const query = `
    INSERT INTO activity
      (id, primaryEmail, timestamp, serviceName, activityType, content)
    VALUES
      (?, ?, ?, ?, ?, ?)
    `;
    conn.execute(query, [id, primaryEmail, timestamp, serviceName, activityType, content])
    const dbactivity = conn.execute("SELECT * FROM activity WHERE id = (?)", [id])
    console.log("Inserted activity into database")
    console.log(dbactivity)
    return {
      status: 200,
      headers: { "Content-type": "application/json" },
      body: encoder.encode("Successfully inserted activity " + id + " into Database").buffer
    }
  } catch (err) {
  console.log(JSON.stringify(err));
  return { status: 500, body: encoder.encode("Returned error: " + err).buffer }
}


}

