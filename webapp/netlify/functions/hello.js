// Example serverless function for Netlify
exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello from Jingle.AI Netlify function!",
      timestamp: new Date().toISOString()
    })
  };
};
