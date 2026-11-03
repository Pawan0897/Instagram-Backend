# insta-api

Converted from the `app/modules/...` + `services` + globals structure to a flat
**routes → Controller → Modal** structure. All API URLs, request/response formats,
roles, validation rules and DB collections are unchanged.

## Run

```bash
cp .env.example .env      # fill db_url, jwt_secret, ...
npm install
npm run dev               # or: npm start
```

Every request needs the header `x-portal`:
`user` (or `staff`) for normal routes, `admin` for `/admin/*` routes.
User and admin portals now run on **one server / one port** (`app_port`, default 3000).

## Structure

```
app.js                    server, middlewares, route mounting
CommonFunction/           Constants, Messages, Functions, SendMail, EmailTemplate, OtpService, S3Upload, SendSMS
Controller/               one file per API : logic of the old services is inside these
Midleware/                auth, validator, response, portal, multer, logger, encryption, decryption
Modal/                    mongoose models (export UPPERCASE name e.g. { USER })
Validation/               Joi schema per API (used with Midleware/validator.js)
db_connection/            db.js (connect), migration.js (seed data), redis.js
routes/                   one router per API
multerImages/  logs/      uploaded images (served on /images) and winston logs
```

## API map (URLs are the same as before)

| Mounted on | routes/ | Controller/ | Modal/ |
|---|---|---|---|
| `/onboarding` | user.js | user.js | user, otp, sessions, post |
| `/post` | post.js | post.js | post, follow |
| `/like` | like.js | like.js | like, post |
| `/comment` | comment.js | comment.js | comment, post |
| `/follow` | follow.js | follow.js | follow, user |
| `/address` | address.js | address.js | address |
| `/admin/onboarding` | admin.js | admin.js (re-uses user.js handlers; role is picked from `req.portal`) | user, otp, sessions |
| `/admin/access-role` | accessRole.js | accessRole.js | accessRole, user |

## Old → new

| Old | New |
|---|---|
| `modules/*/core/controllers/*.js` (router + handlers) | `routes/*.js` + `Controller/*.js` |
| `modules/*/services/*.js` | merged into `Controller/*.js` |
| `app/models/*.js` + `models/index.js` | `Modal/*.js` |
| `app/validations/*.js` | `Validation/*.js` |
| `app/middlewares/*.js` | `Midleware/*.js` (+ new `portal.js`) |
| `app/utils/functions.js`, `config/constants.js`, `locals/en.js`, `emailTemplates/en.js` | `CommonFunction/*` |
| `app/services/{Email,Otp,Upload,SmsServices}.js` | `CommonFunction/{SendMail,OtpService,S3Upload,SendSMS}.js` (+ `Midleware/multer.js` for the disk upload) |
| `startup/db.js`, `startup/migration.js`, `startup/redis.js` | `db_connection/*` |
| `app.js` + `admin.js` + `bin/www.js` + `bin/admin.js` | one `app.js` |
| `config/config.js` (Config class) | `process.env` directly (same env names) |
| globals `Model`, `Services`, `MSG`, `Auth`, `Validator`, `Validations`, `Func`, `dbHelper`, `constants`... | normal `require`s |

## Removed on purpose (no effect on the APIs)

- Swagger docs (`/core/documentation`, `/admin/documentation`) and its packages (`swagger-jsdoc`, `swagger-ui-express`, `joi-to-swagger`).
- `socket.io` setup in the admin server (`global.io` was never used), `request-context` middleware (nothing read it), `dbHelper` wrapper (models are called directly), unused `utils/responses.js`.
- Unused packages: stripe, firebase-admin, agora-token, axios, qrcode, aws-sdk v2, multer-s3, body-parser ...
- Debug `console.log(req)` / header dumps.

## Signup API (new)

`POST /onboarding/signup`  (header `x-portal: user`)

```json
{
  "firstName": "Rahul",
  "lastName": "Sharma",
  "email": "rahul@test.com",
  "password": "123456",
  "phone": "9999999999",
  "countryCode": "+91",
  "deviceType": "WEB",
  "deviceToken": "abc"
}
```

Required : `firstName`, `email`, `password` (min 6). Rest is optional.
Flow (same as every other API) : `routes/user.js` -> `Validation/user.js (register)` -> `Controller/user.js (signup)` -> `Modal/user.js`.
It creates the user (role = user), creates a session and returns the user with a `token` (use it as `Authorization: Bearer <token>`).
If the email is already used you get "Email Id already in use."

## Fixes done in this version

1. `package.json` was missing -> added (run `npm install`).
2. Mongoose pre-hooks (`sessions`, `accessRole`, `faq`, `otp`, `user`) declared `next` and did not always call it -> they are plain `async` functions now, so `save()` never hangs.
3. `Midleware/validator.js` crashed ("Cannot read properties of undefined (reading 'map')") for fields that use `.error(new Error(...))` -> now returns a normal 400 message.
4. Login validation: `email` and `password` are required now (an empty body could match a wrong user).
5. Session + token code was repeated in signup / login / verify-otp -> one helper `loginResponse()` in `Controller/user.js`.
6. `PUT /onboarding/user` and `verify-otp-to-update` returned the password hash -> removed from the response.
7. `send-otp-to-update` searched on `userId` (field does not exist) -> now `_id`.
8. `POST /onboarding/` saved the image in `image`, the Post model uses `post` -> fixed. Missing file now gives a message instead of a crash (also in post create / update).
9. User model: `studyLocation` / `institutionType` are arrays (as the validation expects); the broken latitude/longitude update hook is removed; the update hook reads the user id correctly.
10. Migration used `name` (not in the user model) -> `firstName`.
11. Error handler: a normal `Error` was treated as 500 and its message was hidden in prod -> now 400 with the real message (only real 500s are hidden in prod).
12. `autoIndex` is on, so the TTL indexes of `otp` and `sessions` are really created.
13. Access role: delete of a missing id crashed -> "Invalid id"; update returns the new data.
14. `likeByMe` could never fail (`find` returns an array) -> checks `.length`.
15. Uploaded file name = `<time>.<ext>` (original names with spaces broke the image url). Default `BASE_URL` port = 3000.

## Noticed but NOT changed

- OTP code is hard-coded `"1234"` (`Modal/otp.js`, TODO in original) - set a real generator before going live.
- `migrate()` seeds admin accounts with password `Test@123` - change it for production.
- `POST /address/addresses` has no login check.
- `signup` marks the email as verified without an OTP (same as the signup in the second project).
