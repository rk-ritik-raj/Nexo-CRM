export const buildMongoQuery = (rules: any[]) => {
  if (!rules || rules.length === 0) {
    return {};
  }

  const queryParts = rules.map((rule) => {
    const { field, operator, value } = rule;
    const part: any = {};

    switch (field) {
      case "totalSpend":
        if (operator === "gt") part[field] = { $gt: Number(value) };
        else if (operator === "lt") part[field] = { $lt: Number(value) };
        else if (operator === "eq") part[field] = Number(value);
        break;

      case "city":
      case "name":
      case "phone":
        if (operator === "eq") {
          part[field] = { $regex: new RegExp(`^${escapeRegExp(String(value))}$`, "i") };
        } else if (operator === "contains") {
          part[field] = { $regex: new RegExp(escapeRegExp(String(value)), "i") };
        }
        break;

      case "lastPurchaseDate":
        if (operator === "lt_days_ago") {
          // Purchased MORE than X days ago (older than X days)
          const dateLimit = new Date();
          dateLimit.setDate(dateLimit.getDate() - Number(value));
          part[field] = { $lt: dateLimit };
        } else if (operator === "gt_days_ago") {
          // Purchased WITHIN the last X days (newer than X days)
          const dateLimit = new Date();
          dateLimit.setDate(dateLimit.getDate() - Number(value));
          part[field] = { $gte: dateLimit };
        }
        break;

      default:
        break;
    }

    return part;
  });

  // Filter out empty parts
  const validParts = queryParts.filter((p) => Object.keys(p).length > 0);

  if (validParts.length === 0) return {};
  if (validParts.length === 1) return validParts[0];

  return { $and: validParts };
};

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
