import { UPITransaction, Users } from "../../models";
import { Request, Response } from 'express';
import { getRandomFourDigitNumber } from "../../util/random";
import axios from "axios";

const id : any = {};

export const depsoitByUPI = async (req: Request, res: Response) => {
    const { data } = req.body;

    let payload : any;

    console.log("data", data);

    payload["customer_name"] = data.customer_username;
    payload["customer_email"] = data.customer_email;
    payload["customer_mobile"] = data.customer_phonenumber;
    payload["amount"] = data.amount;
    payload["key"] = "ddfaf00e-88a3-4ab8-85cd-5f7bb2820dd8";
	payload["client_txn_id"] = data.username + Date.now() + getRandomFourDigitNumber();
	payload["p_info"] = "India 777 gambling";
	payload["redirect_url"] = "http://google.com";

    id[payload["client_txn_id"]] = { time: 0 };
	id[payload["client_txn_id"]].id = setInterval(
		async () =>
			await checkPayment(
				payload["client_txn_id"],
				formatDate(new Date(Date.now()), "dd-mm-yyyy"),
				data,
			),
		3000,
	);

    let response = await axios
		.post("https://merchant.upigateway.com/api/create_order", payload)
		.then(async (res) => {
            let transaction = new UPITransaction({
                userId: data.userId,
                tx_username: data.customer_username,
                tx_email: data.customer_email,
                tx_phonenumber: data.customer_phonenumber,
                tx_transaction_id: payload["client_txn_id"],
                tx_amount: data.amount,
                status: "pending",
            })

            await transaction.save();

			console.log("res", res.data)
			return res.data;
		})
		.catch((e) => {
			console.log(e);
			return e;
		});

	res.json(response);
}

async function checkPayment(client_txn_id: any, txn_date: any, user: any) {	
	await axios
		.post("https://merchant.upigateway.com/api/check_order_status", {
			client_txn_id,
			txn_date,
			key: process.env.merchant_key,
		})
		.then(async (res) =>  {
			const data = res.data;
			if (data.status === true) {
				const info = data.data;
				if (info.status === "success") {
					clearInterval(id[client_txn_id].id);

                    const transaction = await UPITransaction.findOne({"tx_transaction_id" : id[client_txn_id]})

                    if(transaction.status ="pending") {
                        await Users.updateOne({ _id : user.userId }, {$inc: { 'amount': data.data.amount } });
                        await UPITransaction.updateOne({"tx_transaction_id" : id[client_txn_id]}, {status : "success"})
                    }

					delete id[client_txn_id];
				} else if (info.status === "failure" || id[client_txn_id].time >= 100) {
					clearInterval(id[client_txn_id].id);

                    const transaction = await UPITransaction.findOne({"tx_transaction_id" : id[client_txn_id]})

					if(transaction.status ="pending") {
                        await UPITransaction.updateOne({"tx_transaction_id" : id[client_txn_id]}, {status : "failure"})
                    }

					delete id[client_txn_id];
				} else {
					id[client_txn_id].time++;
				}
			}
			return res.data;
		})
		.catch((e) => {
			console.log(e);
		});
}

function formatDate(date: any, format: any) {
    const ISTOptions = {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };

    const ISTDate = date.toLocaleString('en-IN', ISTOptions);
    
    const map: Record<string, string> = {
        "mm": ISTDate.slice(3, 5),
        "dd": ISTDate.slice(0, 2),
        "yy": ISTDate.slice(8, 10),
        "yyyy": ISTDate.slice(6, 10)
    };
    
    return format.replace(/dd|mm|yyyy/gi, (matched : string) => map[matched]);
}

function stringToDate(dateString : string) {
    // Split the string into day, month, and year components
    const [day, month, year] = dateString.split('-').map(Number);

    // Create a new Date object with the components
    const date = new Date(year, month - 1, day); // month is 0-based in JavaScript Date objects

    // Set the time zone to Indian Standard Time (IST)
    date.setTime(date.getTime() + (5.5 * 60 * 60 * 1000)); // 5.5 hours ahead for IST (5 hours + 30 minutes)

    return date;
}