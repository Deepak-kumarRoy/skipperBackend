require('dotenv').config();
const express = require("express")
const router = express.Router();
var typeorm = require('typeorm');
const cors = require('cors');
const bodyParser = require('body-parser');
const wf_instance_table = "wf_instance";
const wf_steps_table = "wf_steps";
const wf_task_table = "wf_task";

router.use(bodyParser.json())

router.use(cors({
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],

}))

/**
* Description: '/formdata' endpoint is for saving all the forms data irrespective of the request name
* Params: No params
* Body: No body
* Created By: Deepak
* Created At:
* Updated By: Deepak
* Updated At: 
**/

router.post('/formdata', async (req, res) => {

    if (req.headers.authentication == undefined) {
        res.send("unauthorised");
    }

    try {

        const connection = typeorm.getConnection();

        const data = await connection.getRepository(wf_task_table)
            .createQueryBuilder().getMany();

        const len = await connection.getRepository(wf_steps_table)
            .createQueryBuilder()
            .where({ step_name: req.body.wf_name, step_num: 1 })
            .getRawOne();

        let curr_user = len.wf_steps_assignto_user;
        let curr_step = 1;
        let wf_id = len.wf_steps_wf_id;
        let client_id = req.body.user.client_id;
        let requester_id = req.body.user.id;
        let start = new Date();
        let dode = new Date();
        let wf_data = req.body.details;
        let wf_status = "ST";
        let comment = req.body.details.comm;

        await connection.getRepository(wf_instance_table)
            .createQueryBuilder()
            .insert()
            .values({ wf_id, client_id, requester_id, curr_user, curr_step, start, wf_data, wf_status, dode, comment }).execute();

        let client_code = "AABC";
        const num = await connection.getRepository(wf_instance_table)
            .createQueryBuilder().getMany();

        let wf_step_id = len.wf_steps_id;
        let assigned_user = len.wf_steps_assignto_user;
        let task_status = "AS";
        let wf_instance_id = num.length + 1;

        await connection.getRepository(wf_task_table)
            .createQueryBuilder()
            .insert()
            .values({ client_code, wf_instance_id, wf_step_id, assigned_user, start, task_status, dode }).execute();

        res.status(200).json({
            "message": "Request no " + `${num.length + 1}` + " is created sucessfully"
        })
    } catch (err) {
        console.log(err)
        return res.status(501).send(err)
    }
})

/**
* Description: '/workflow' endpoint gives the data if any request is raised for your approval
* Params: No params
* Body: No body
* Created By: Deepak
* Created At:
* Updated By: Deepak
* Updated At: 
**/

router.post('/workflow', async (req, res) => {

    if (req.headers.authentication == undefined) {
        res.send("unauthorised");
    }

    try {

        const connection = typeorm.getConnection();
        let id = req.body.user.id;

        const result = await connection.getRepository(wf_instance_table)
            .createQueryBuilder('wi')
            .innerJoinAndSelect("wf", "wf", "wf.id = wi.wf_id")
            .innerJoinAndSelect("users", "u", "u.id = wi.requester_id")
            .where("wi.curr_user = :user", { user: id })
            .andWhere("wi.wf_status = :stat", { stat: 'ST' })
            .getRawMany();

        res.status(200).json({
            result
        })
    } catch (err) {
        console.log(err)
        return res.status(501).send(err)
    }
})

/**
* Description: '/wf_data' endpoints gives the complete details of the request raised for approval
* Params: No params
* Body: No body
* Created By: Deepak
* Created At:
* Updated By: Deepak
* Updated At: 
**/

router.post('/wf_data', async (req, res) => {

    if (req.headers.authentication == undefined) {
        res.send("unauthorised");
    }

    try {

        const connection = typeorm.getConnection();

        let result = await connection.getRepository(wf_instance_table)
            .createQueryBuilder()
            .where({ id: req.body.id })
            .getMany();

        let comment = await connection.getRepository(wf_task_table)
            .createQueryBuilder("wt")
            .leftJoinAndSelect("users", "u", "u.id=wt.assigned_user")
            .where({ wf_instance_id: req.body.id })
            .getRawMany();

        // console.log(comment)

        res.status(200).json({
            result,
            comment
        })
    } catch (err) {
        console.log(err)
        return res.status(501).send(err)
    }
})

/**
* Description:'/approve' endpoint triggers when the user approves any request and then the request moves to next approver
* Params: No params
* Body: No body
* Created By: Deepak
* Created At:
* Updated By: Deepak
* Updated At: 
**/

router.put('/approve', async (req, res) => {

    if (req.headers.authentication == undefined) {
        res.send("unauthorised");
    } 
    
    try {

        const connection = typeorm.getConnection();

        let result = await connection.getRepository(wf_instance_table)
            .createQueryBuilder()
            .where({ id: req.body.id })
            .getOne();

        let step = result.curr_step;
        let id = result.wf_id;
        let start = result.start

        const next = await connection.getRepository(wf_steps_table)
            .createQueryBuilder()
            .where({ wf_id: id, step_num: step + 1 })
            .getOne();

        if (next !== undefined) {

            let user = next.assignto_user;
            let date = new Date();
            await connection.getRepository(wf_instance_table)
                .createQueryBuilder()
                .update(wf_instance_table)
                .set({ curr_user: user, curr_step: step + 1, dode: date })
                .where({ id: req.body.id })
                .execute();

            let assigned_user = result.curr_user;
            let wf_instance_id = req.body.id
            let client_code = "AABC"
            let comment = req.body.comm;
            let task_status = 'AP';
            let dode = new Date();
            let wf_step_id = next.id - 1;

            await connection.getRepository(wf_task_table)
                .createQueryBuilder()
                .insert()
                .values({ client_code, wf_instance_id, wf_step_id, assigned_user, start, comment, task_status, dode })
                .execute();
            res.send(
                { "message": "workflow approved" }
            )
        } else {
            res.send(
                { "message": "Notification Alert Send to IT Department" }
            )
        }
    } catch (err) {
        console.log(err)
        return res.status(501).send(err)
    }
})

/**
* Description: '/reject' endpoint triggers when the approver rejects any request
* Params: No params
* Body: No body
* Created By: Deepak
* Created At:
* Updated By: Deepak
* Updated At: 
**/

router.put('/reject', async (req, res) => {

    if (req.headers.authentication == undefined) {
        res.send("unauthorised");
    } 
    
    try {

        const connection = typeorm.getConnection();

        const data = await connection.getRepository(wf_instance_table)
            .createQueryBuilder()
            .where({ id: req.body.id })
            .getOne();

        let id = data.requester_id;

        await connection.getRepository(wf_instance_table)
            .createQueryBuilder()
            .update()
            .set({ curr_user: id, wf_status: 'RJ' })
            .where({ id: req.body.id })
            .execute();


        let client_code = "AABC"
        let wf_instance_id = req.body.id;
        let wf_step_id = data.curr_step;
        let assigned_user = data.curr_user;
        let start = data.start;
        let comment = req.body.comm;
        let task_status = 'RJ'
        let dode = new Date();

        await connection.getRepository(wf_task_table)
            .createQueryBuilder()
            .insert()
            .values({ client_code, wf_instance_id, wf_step_id, assigned_user, start, comment, task_status, dode })
            .execute();

        res.send(
            { "message": "workflow rejected" }
        )
    } catch (err) {
        console.log(err)
        return res.status(501).send(err)
    }
})

/**
* Description: '/status' endpoint is for tracking all the activities done by a user like creating a request or approving the request etc
* Params: No params
* Body: No body
* Created By: Deepak
* Created At:
* Updated By: Deepak
* Updated At: 
**/

router.post('/status', async (req, res) => {

    if (req.headers.authentication == undefined) {
        res.send("unauthorised");
    }
    
    try {

        const connection = typeorm.getConnection();
        let id = req.body.user.id;

        const data = await connection.getRepository(wf_task_table)
            .createQueryBuilder("wt")
            .innerJoinAndSelect("wf_instance", "wi", "wi.id=wt.wf_instance_id")
            .innerJoinAndSelect("users", "u", "u.id=wi.requester_id")
            .innerJoinAndSelect("users", "us", "us.id=wt.assigned_user")
            .innerJoinAndSelect("wf", "wf", "wf.id = wi.wf_id")
            .where("wi.requester_id=:id", { id: req.body.user.id })
            .orWhere("wt.assigned_user=:idx", { idx: req.body.user.id })
            .getRawMany()

        // const data = await connection.getRepository(wf_instance_table)
        // .createQueryBuilder('wi')
        // .innerJoinAndSelect("wf", "wf", "wf.id = wi.wf_id")
        // .innerJoinAndSelect("users", "u", "u.id = wi.requester_id")
        // .where("wi.curr_user = :user",{user:id})
        // .orWhere("wt.assigned_user=:idx",{idx:req.body.user.id})
        // .getRawMany();

        // console.log(data)

        res.status(200).json({
            data
        })
    } catch (err) {
        console.log(err)
        return res.status(501).send(err)
    }
})

/**
* Description:'/redo' this endpoint return data only if the status is reassign
* Params: No params
* Body: No body
* Created By: Deepak
* Created At:
* Updated By: Deepak
* Updated At: 
**/

router.post('/redo', async (req, res) => {

    if (req.headers.authentication == undefined) {
        res.send("unauthorised");
    } 
    
    try {
        const connection = typeorm.getConnection();

        const data = await connection.getRepository(wf_task_table)
            .createQueryBuilder()
            .where({ id: req.body.id })
            .getOne();

        let wf = data.wf_instance_id

        const formdata = await connection.getRepository(wf_instance_table)
            .createQueryBuilder("wi")
            .innerJoinAndSelect("wf_task", "wt", "wt.wf_instance_id=wi.id")
            .where({ id: wf })
            .andWhere("wt.task_status = :stat", { stat: 'RS' })
            .getOne();

        res.status(200).json({
            formdata,
            wf
        })
    } catch (err){
        console.log(err)
        return res.status(501).send(err)
    }
})

/**
* Description: '/reassign' endpoints triggers when a request is reassigned to requester for some modification
* Params: No params
* Body: No body
* Created By: Deepak
* Created At:
* Updated By: Deepak
* Updated At: 
**/

router.put('/reassign', async (req, res) => {

    if (req.headers.authentication == undefined) {
        res.send("unauthorised");
    } 
    
    try {
        const connection = typeorm.getConnection();

        let requester = await connection.getRepository(wf_instance_table)
            .createQueryBuilder()
            .where({ id: req.body.id })
            .getOne();
        let id = requester.requester_id;

        let client_code = 'AABC';
        let wf_step_id = requester.curr_step;
        let wf_instance_id = requester.id;
        let assigned_user = requester.curr_user;
        let start = requester.start;
        let dode = new Date();


        await connection.getRepository(wf_instance_table)
            .createQueryBuilder()
            .update()
            .set({ curr_user: id, wf_status: 'RS' })
            .where({ id: req.body.id })
            .execute();

        await connection.getRepository(wf_task_table)
            .createQueryBuilder()
            .insert()
            .values({ client_code, wf_instance_id, wf_step_id, assigned_user, start, comment: req.body.comm, task_status: 'RS', dode })
            .execute();
    } catch (err) {
        console.log(err)
        return res.status(501).send(err)
    }
})

/**
* Description: This route will fetch all the details for a particular Project
* Params: No params
* Body: No body
* Created By: Deepak
* Created At:
* Updated By: Deepak
* Updated At: 
**/

router.post('/resubmit', async (req, res) => {

    if (req.headers.authentication == undefined) {
        res.send("unauthorised");
    }

    try {
    const connection = typeorm.getConnection();

    const data = await connection.getRepository(wf_instance_table)
        .createQueryBuilder()
        .where({ id: req.body.id })
        .getOne();

    let step = data.curr_step;
    let id = data.wf_id;

    const user = await connection.getRepository(wf_steps_table)
        .createQueryBuilder()
        .where({ wf_id: id, step_num: step })
        .getOne();

    let curr_user = user.assignto_user;

    await connection.getRepository(wf_instance_table)
        .createQueryBuilder()
        .update()
        .set({ curr_user, wf_data: req.body.value, wf_status: 'ST' })
        .where({ id: req.body.id })
        .execute();

    } catch (err) {
        console.log(err)
        return res.status(501).send(err)
    }
})

module.exports = router;