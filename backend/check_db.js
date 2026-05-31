const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://admin:admin@cluster0.hzhq4.mongodb.net/workspace?retryWrites=true&w=majority');
const Staff = mongoose.model('Staff', new mongoose.Schema({}, {strict: false}), 'staffs');
const UserProfile = mongoose.model('UserProfile', new mongoose.Schema({}, {strict: false}), 'userprofiles');
async function check() {
  const s = await Staff.find({});
  const u = await UserProfile.find({});
  console.log("STAFFS:", s.map(x=>x.email));
  console.log("USERPROFILES:", u.map(x=>x.email));
  process.exit(0);
}
check();
