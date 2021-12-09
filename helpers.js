

const findUser = (newEmail, users) => {
  for (const id in users) {
    const user = users[id];
    if (user["email"] === newEmail) {
      return user;
    }
  }
  return null;
};

module.exports = {findUser};