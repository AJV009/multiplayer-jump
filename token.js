exports.handler = function (context, event, callback) {
  const AccessToken = Twilio.jwt.AccessToken;
  const ChatGrant = AccessToken.ChatGrant;
  const SyncGrant = AccessToken.SyncGrant;

  function tokenGenerator() {
    const token = new AccessToken(
      context.ACCOUNT_SID,
      context.TWILIO_API_KEY,
      context.TWILIO_API_SECRET,
      { identity: event.identity }
    );

    if (context.TWILIO_SYNC_SERVICE_SID) {
      const syncGrant = new SyncGrant({
        serviceSid: context.TWILIO_SYNC_SERVICE_SID || "default",
      });
      token.addGrant(syncGrant);
    }

    const response = new Twilio.Response();
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    response.setHeaders(headers);
    response.setBody({
      token: token.toJwt(),
    });

    return response;
  }

  return callback(null, tokenGenerator());
};
