const createCustomError = (errors) => {
  return errors.array().map((err) => {
    return {
      field: {
        name: err.param,
        error: err.msg,
      },
    };
  });
};

const calculateCommission = (
  { discount, influencerCommission, adminCommission },
  grossAmount
) => {
  const discountValue = (discount / 100) * grossAmount;
  const netPrice = grossAmount - discountValue;
  const commission = (adminCommission / 100) * netPrice;
  const takeHome = netPrice - commission;
  const influencer = (influencerCommission / 100) * commission;
  const admin = ((100 - influencerCommission) / 100) * commission;
  return {
    productOriginalPrice: grossAmount,
    merchantRevenue: netPrice,
    merchantCommission: takeHome,
    influencerCommission: influencer,
    influencerCommissionPercentage: influencerCommission,
    redEarning: admin,
    dateCreated: new Date().toUTCString("en-US", {
      timeZone: "Asia/Singapore",
    }),
  };
};

const createFCMPayload = ({ token, title, body }) => {
  const payload = {
    to: token,
    data: {
      title: title,
      body: body,
    },
    content_available: true,
    priority: "high",
  };
  return payload;
};

exports.createCustomError = createCustomError;
exports.calculateCommission = calculateCommission;
exports.createFCMPayload = createFCMPayload;
