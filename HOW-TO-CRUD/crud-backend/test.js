const bcrypt = require('bcrypt');

const testPassword = async () => {
  const plainPassword = 'koki1234'; // Replace with the password you are testing
  const hashedPassword = '$2b$10$Ii5SXT9cJwr2aP8NCdY6Pu//lxgGTIh4e8SreL5zKclQATltFmBui'; // Replace with the hashed password from the database

  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  console.log('Password match:', isMatch);
};

testPassword();