require('dotenv').config();
const express = require("express")
const router = express.Router();
var typeorm = require('typeorm');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = express();
const login_table = "users";
const menu_table = "menu";
const submenu_table = "submenu";
const role_menu_mapping_table = "role_menu_mapping";
const user_role_mapping_table = "user_role_mapping";


router.use(bodyParser.json())


router.use(cors({
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],

}))

router.get('/check', async (req, res) => {
    const connection = typeorm.getConnection();

    var result = await connection.getRepository(login_table)
        .createQueryBuilder().getMany();
    res.status(200).json({
        "Message": "Working",
        result
    })
})

router.post('/signup', async (req, res) => {
    const connection = typeorm.getConnection();
    var { client_id, user_id, password, firstname, lastname, country, langu, email_id, contact_no, status } = req.body;
    password = await bcrypt.hash(password, 10);

    var result = await connection.getRepository(login_table)
    let userLogin = await result.findOne({ email_id: req.body.email_id });

    if (userLogin === undefined) {

        await connection.getRepository(login_table)
            .createQueryBuilder()
            .insert()
            .values({ client_id, user_id, password, firstname, lastname, country, langu, email_id, contact_no, status }).execute();

        res.send({
            "Message": "user registered successfully"
        })

    } else {
        res.send({
            "Message": "user already exist"
        })
    }

});

router.post('/login', async (req, res) => {
    const connection = typeorm.getConnection();

    var result = await connection.getRepository(login_table)

    const accessToken = jwt.sign({ email_id: req.body.email_id }, process.env.JWT_SECRET, async (err, token) => {

        let userLogin = await result.findOne({ email_id: req.body.email_id, client_id: req.body.client_id });
        

        if (userLogin === undefined) {
            res.send({
                "Message": "invalid credentials"
            })
        }
         else {
            var pass = await bcrypt.compare(req.body.password, userLogin.password)
           
            const data =  await connection.getRepository(role_menu_mapping_table)
            .createQueryBuilder('rm')
            .innerJoinAndSelect("user_role_mapping", "us","us.role_id = rm.role_id")
            .innerJoinAndSelect("menu", "m","m.id = rm.menu_id")
            .innerJoinAndSelect("submenu", "sm","m.id = sm.menu_id")
            .where ("us.user_id = :idx",{idx:userLogin.id})
            .getRawMany();

                console.log(data)

            if (pass === false) {
                res.send({
                    "Message": "password is wrong"
                })
            } else
             {
                res.status(200).json({
                    userLogin,
                    data,
                    accessToken: token
                })
            }
        }
    });
})
router.post('/formdata', async (req, res) => {
    const connection = typeorm.getConnection();
    var result = await connection.getRepository(login_table)

})

module.exports = router;