
const authMiddleware = (req, res, next) => {
  if (!req.session.userId) {
    const host = req.headers.host || '';
    if (host.startsWith('dash.')) {
      return res.redirect('https://wanzofc.site/login');
    }
    return res.redirect('/login');
  }
  next();
};

module.exports = authMiddleware;