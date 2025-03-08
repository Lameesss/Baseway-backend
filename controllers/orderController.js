
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from 'stripe'
import razorpay from 'razorpay'


//global variables 
const currency = 'inr'
const deliveryCharge = 10

// gateway initialize 
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)


// Razorpay 

const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret :process.env.RAZORPAY_KEY_SECRET,
})


//placing orders using COD method
const PlaceOrder = async (req, res) => {
    try {
       const { userId, items, amount, address } = req.body;
       
       const orderData = {
          userId,
          items,
          address,
          amount,
          paymentMethod: 'COD', // for now; Stripe and Razorpay can have different routes
          payment: false,
          date: Date.now()
       };
 
       const newOrder = new orderModel(orderData);
       await newOrder.save();
 
       // Clear user cart after order placement
       await userModel.findByIdAndUpdate(userId, { cartData: {} });
 
       res.json({ success: true, message: "Order Placed" });
    } catch (error) {
       console.error(error);
       res.json({ success: false, message: error.message });
    }
 };
 

//placing orders using Stripe method
const PlaceOrderStrip = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body;
        const origin = req.headers.origin;  // Correct the header to 'origin'

        if (!origin) {
            return res.json({ success: false, message: "Origin header is missing" });
        }

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod: 'Stripe',
            payment: false,
            date: Date.now(),
        };

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        const line_items = items.map((item) => ({
            price_data: {
                currency: currency,
                product_data: {
                    name: item.name,
                },
                unit_amount: item.price * 100,
            },
            quantity: item.quantity,
        }));

        // Add delivery charges as an item
        line_items.push({
            price_data: {
                currency: currency,
                product_data: {
                    name: 'Delivery Charges',
                },
                unit_amount: deliveryCharge * 100,
            },
            quantity: 1,
        });

        // Create the Stripe session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
        });

        res.json({ success: true, session_url: session.url });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// verify Stripe 
const verifyStripe = async (req,res)=>{

  const {orderId,success,userId} = req.body

  try {
    if(success === "true"){
        await orderModel.findByIdAndUpdate(orderId,{payment:true})
        await userModel.findByIdAndUpdate(userId,{cartData:{}})
        res.json({success:true});
    }else{
        await orderModel.findByIdAndDelete(orderId)
        res.json({success:false})
    } 


    
  } catch (error) {

    console.log(error);
    res.json({ success: false, message: error.message });
    
  }

}





//placing orders using Razorpay method
const PlaceOrderRazorpay = async  (req, res) =>{

    try {

        const { userId, items, amount, address } = req.body;


       

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod: 'Razorpay',
            payment: false,
            date: Date.now(),
        };

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        const options ={

            amount:amount *100 ,
            currency :currency.toUpperCase(),
            receipt: newOrder._id.toString()
        }

        await razorpayInstance.orders.create(options,(error,order)=>{
            if(error){
                console.log(error);
                return res.json({success:false,message:error})
                
            }
            res.json({success:true,order})
        })


        
    } catch (error) {

        console.log(error);
        res.json({success:false,message:error.message})
        
        
    }

    
}


const verifyRazorpay = async (req,res) =>{

     try {

        const {userId,razorpay_order_id} = req.body

        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)
        if(orderInfo.status === 'paid'){
            await orderModel.findByIdAndUpdate(orderInfo.receipt,{payment:true});
            await userModel.findByIdAndUpdate(userId,{cartData:{}})
            res.json({success:true,message:'Payment Successful'})

        }else{
            res.json({success:false,message:'Payment Failed'})
        }
        
     } catch (error) {

        console.log(error);
        res.json({success:false,message:error.message})
        
     }
     
}



//All orders data for admin panel 
const allOrders = async  (req, res) =>{

    try {

        const orders = await orderModel.find({})
        res.json({success:true,orders})
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }

    
}

//User Orders Data for Frontend
const userOrders = async (req, res) =>{

    try {
        const {userId} = req.body

        const orders = await orderModel.find({userId})
        res.json({success:true,orders})

    } catch (error) {

        console.log(error)
        res.json({success:false,message:error.message})
        
    }



    
}

//update order status from admin panel
const UpdateStatus = async  (req, res) =>{
      
    try {
        const {orderId,status} = req.body

        await orderModel.findByIdAndUpdate(orderId,{status})
        res.json({success:true,message:'Status Updated'})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
    
}


export {verifyRazorpay,verifyStripe,PlaceOrder,PlaceOrderStrip,PlaceOrderRazorpay,allOrders,userOrders,UpdateStatus}