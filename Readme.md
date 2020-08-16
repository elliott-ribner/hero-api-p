
to run:
npm i && npm start

to test:
npm i && npm test

standardJs is used for lint / codestyle convention: https://standardjs.com/

ENDPOINTS:
- '/events' (POST)
- '/events/:merchantId' (GET)
- '/eventSummary/:merchantId' (GET)

If this was production code there a few things some further steps I would take:
- Better alidate the incoming events on the post request.
- If there is schema validation issues, clean these up a bit and pass then back in the response so it is more obvious.
- Ofcourse, I have stubbed out my internal api call to dev.backend.hero, that should be restored!
- Clean up the config file.
- Use swagger or apiDoc to create api documentation
