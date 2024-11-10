export const validateSingleTranslation = (req, res, next) => {
  const { cvPoint, targetDomain } = req.body;

  if (!cvPoint || typeof cvPoint !== 'string') {
    return res.status(400).json({ error: 'Valid CV point is required' });
  }

  if (!targetDomain || !isValidDomain(targetDomain)) {
    return res.status(400).json({ error: 'Valid target domain is required' });
  }

  next();
};

export const validateStarPoint = (req, res, next) => {
  const { cvPoint, context } = req.body;

  if (!cvPoint || typeof cvPoint !== 'string') {
    return res.status(400).json({ error: 'Valid CV point is required' });
  }

  next();
};

export const validateBulkTranslation = (req, res, next) => {
  const { cvPoints, targetDomain } = req.body;

  if (!Array.isArray(cvPoints) || cvPoints.length === 0) {
    return res.status(400).json({ error: 'Valid CV points array is required' });
  }

  if (cvPoints.length > 20) {
    return res.status(400).json({ error: 'Maximum 20 CV points allowed per request' });
  }

  if (!targetDomain || !isValidDomain(targetDomain)) {
    return res.status(400).json({ error: 'Valid target domain is required' });
  }

  next();
};

const isValidDomain = (domain) => {
  const validDomains = ['marketing', 'sales', 'consulting', 'product-management', 'finance'];
  return validDomains.includes(domain.toLowerCase());
};
