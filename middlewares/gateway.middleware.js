module.exports = function gateway () {
  return async (req, res, next) => {
    try {
      if (req.method === 'POST') {
        const { 'x-origin': origin } = req.headers;
        const { action, params } = req.body;
        if (action && (origin !== req.$service.broker.namespace)) {
          // console.log('ACTION', action);
          // console.log('PARAMS', params);
          // console.log('ORIGIN', origin);
          const result = await req.$service.broker.call(action, params);
          return res.end(result);
        }
      }

      res.statusCode = 400;
      res.statusMessage = 'Bad request';
      return res.end();
    } catch (error) {
      console.error(`Error: `, error.message);
      res.statusCode = error.code || 400;
      res.statusMessage = error.message;
      return res.end();
    }
  };
};