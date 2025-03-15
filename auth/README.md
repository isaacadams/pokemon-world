example successful oauth response

```json
{
   "ok": true,
   "app_id": "",
   "authed_user": {
      "id": "",
      "scope": "identity.basic,identity.email,identity.avatar",
      "access_token": "xoxp-",
      "token_type": "user"
   },
   "team": {
      "id": ""
   },
   "enterprise": null,
   "is_enterprise_install": false
}
```

example of failed oauth response

https://api.slack.com/methods/oauth.v2.access#errors

```json
{ "ok": false, "error": "invalid_code" }
```
