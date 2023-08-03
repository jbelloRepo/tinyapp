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
}

module.exports = { getUserByEmail };
