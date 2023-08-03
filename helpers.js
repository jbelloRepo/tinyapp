/**
 *
 * @param {String} email
 * @param {String} users
 * @returns user
 */
function getUserByEmail(email, users) {
  for (let userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
}

module.exports = { getUserByEmail };
