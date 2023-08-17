# chatgpt-summerizer
A Spin app which wraps ChatGPT to generate a sentence fragment summary that can be used in an automated email sequence.

The app works by having data regularly pushed into it from CommonRoom. Then a trigger from something like https://cron-job.org is used once a day on weekdays to trigger processing. Eventually this should call back into CommonRoom to update a custom field and data should be deleted from the noop database.

# Configuration
Two KV variables need to be setup for this to work:

auth_token: This is the token which needs to be passed as the "x-commonroom-webhook-secret" header for the app to authenticate to either the store endpoint or the trigger endpoint

openai_key: This is an API key to connect to openai. It's necessary only for the trigger endpoint.

# Push activity into store
Send POST of the activity to http(s)://<app>/ in the following example format:

{
	"payload": {
		"type": "activity",
		"member": {
			"github": "chrismatteson",
			"discord": "chrismatteson",
			"twitter": "MattesonChris",
			"fullName": "Chris Matteson",
			"linkedIn": "in/chris-matteson-09a66b61",
			"allEmails": ["chris.matteson@fermyon.com", "chris.matteson@gmail.com"],
			"githubUrl": "https://github.com/chrismatteson",
			"discordUrl": "https://discord.com/users/902595688414732299",
			"twitterUrl": "https://twitter.com/i/user/505981441",
			"linkedInUrl": "https://linkedin.com/in/chris-matteson-09a66b61",
			"organization": {
				"name": "Fermyon Technologies",
				"domain": "fermyon.com",
				"location": {
					"city": "San Francisco",
					"region": "California",
					"country": "United States"
				}
			},
			"primaryEmail": "chris.matteson@fermyon.com"
		},
		"content": "Does Spin support Assemblyscript?",
		"version": "202304",
		"timestamp": "2023-08-14T20:19:26.379Z",
		"serviceName": "Discord",
		"activityType": "DiscordPost",
		"externalActivityUrl": "https://discord.com/channels/926888690310053918/1129085467611119686/1140741495079571496",
		"commonRoomActivityUrl": "https://app.commonroom.io/community/2588/activity/eyJwcm92aWRlcklkIjoyNzM1NiwidG9rZW4iOiJkbV8xMTQwNzQxNDk1MDc5NTcxNDk2In0="
	},
	"id": "2588-11410-27356-dmsd_11s4sf0419579571496",
	"source": {
		"type": "workflow",
		"id": 11410,
		"name": "Trigger a webhook for a new activity"
	}
}

# Trigger activity to be processed
Send GET to http(s)://<app>/trigger