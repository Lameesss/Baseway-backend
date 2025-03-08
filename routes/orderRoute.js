import{PlaceOrder,PlaceOrderStrip,PlaceOrderRazorpay,allOrders,userOrders,UpdateStatus, verifyStripe, verifyRazorpay} from '../controllers/orderController.js'
import  express from 'express'

import adminAuth from '../middleware/adminAuth.js'
import authUser from '../middleware/auth.js'

const orderRouter = express.Router()

//Admin Features
orderRouter.post('/list',adminAuth,allOrders)
orderRouter.post('/status',adminAuth,UpdateStatus)

//Payment features
orderRouter.post('/place',authUser,PlaceOrder)
orderRouter.post('/stripe',authUser,PlaceOrderStrip)
orderRouter.post('/razorpay',authUser,PlaceOrderRazorpay)

//user Features
orderRouter.post('/userorders',authUser,userOrders)

//verify payment
orderRouter.post('/verifyStripe',authUser,verifyStripe)
orderRouter.post('/verifyRazorpay',authUser,verifyRazorpay)



export default orderRouter


