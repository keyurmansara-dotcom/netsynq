require('dotenv').config();
const mongoose = require('mongoose');
import('./models/User.js').then(({ default: User }) => {
    mongoose.connect(process.env.MONGO_URI).then(async () => {
        const users = await User.find({ name: /keyur/i });
        console.log(users.map(u => ${u.name} -  - ));
        process.exit(0);
    }).catch(e => { console.error('DB ERROR:', e); process.exit(1); });
});
