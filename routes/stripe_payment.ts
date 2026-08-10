import express from 'express';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');


router.post('/create-payment-intent', async (req, res) =>{
    try{
        const { amount} = req.body;
         const paymentIntent = await stripe.paymentIntents.create({
            amount, 
             currency: "cad",
             automatic_payment_methods:{
                enabled: true},
             });
res.send({clientSecret: paymentIntent.client_secret});
       
    }catch(error: any){
        res.status(500).json({error: error.message});
    }
})

export default router;