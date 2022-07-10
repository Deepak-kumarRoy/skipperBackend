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
const role_table = "role";


router.use(bodyParser.json())


router.use(cors({
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],

}))

/**
* Description: '/check' endpoint is just for checking the backend structure if everything is working fine or not (testing api)
* Params: No params
* Body: No body
* Created By: Deepak
* Created At:
* Updated By: Deepak
* Updated At: 
**/

router.get('/check', async (req, res) => {
    const connection = typeorm.getConnection();

    var result = await connection.getRepository(login_table)
        .createQueryBuilder().getMany();
    res.status(200).json({
        "Message": "Working",
        result
    })
})

/**
* Description: '/signup' endpoint is for creating new user in the application
* Params: No params
* Body: No body
* Created By: Deepak
* Created At:
* Updated By: Deepak
* Updated At: 
**/

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

/**
* Description: '/login' endpoint is for login
* Params: No params
* Body: No body
* Created By: Deepak
* Created At:
* Updated By: Deepak
* Updated At: 
**/

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

            let id = await connection.getRepository(login_table)
            .createQueryBuilder("d")
            .innerJoinAndSelect("user_role_mapping", "e", "d.id = e.user_id")
            .where("d.user_id = :idx", { idx: userLogin.user_id })
            .getRawOne();

        let user = id.e_role_id;
        let menu = await connection.getRepository(role_table)
            .createQueryBuilder("b")
            .innerJoinAndSelect("role_menu_mapping", "c", "b.id = c.role_id")
            .innerJoinAndSelect("menu", "a", "a.id = c.menu_id")
            .where("c.role_id = :idx", { idx: user })
            .getRawMany();
            let submenu = await connection.getRepository(role_table)
            .createQueryBuilder("b")
            .innerJoinAndSelect("role_menu_mapping", "c", "b.id = c.role_id")
            .innerJoinAndSelect("menu", "a", "a.id = c.menu_id")
            .innerJoinAndSelect("submenu", "d", "a.id = d.menu_id")
            .where("c.role_id = :idx", { idx: user })
            .getRawMany();


            if (pass === false) {
                res.send({
                    "Message": "password is wrong"
                })
            } else {
                res.status(200).json({
                    userLogin,
                    data: menu,
                    submenu: submenu,
                    accessToken: token
                })
            }
        }
    });
})



module.exports = router;