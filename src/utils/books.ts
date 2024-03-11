export const sortByField = (field) => {
  return function (a, b) {
    if (a[field] > b[field]) {
      return 1;
    } else if (a[field] < b[field]) {
      return -1;
    }
    return 0;
  };
};
