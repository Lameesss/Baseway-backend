import userModel from "../models/userModel.js"

// add products to user cart 
const addToCart = async (req, res) => {
    try {
      const { userId, itemId, size } = req.body;
      const userData = await userModel.findById(userId);
  
      // Initialize `cartData` if it doesn't exist
      let cartData = userData.cartData || {};
  
      if (cartData[itemId]) {
        // Initialize the size key if it doesn't exist
        cartData[itemId][size] = (cartData[itemId][size] || 0) + 1;
      } else {
        cartData[itemId] = { [size]: 1 };
      }
  
      // Update the user with the modified `cartData`
      await userModel.findByIdAndUpdate(userId, { cartData });
      res.json({ success: true, message: 'Added to Cart' });
  
    } catch (error) {
      console.log(error);
      res.json({ success: false, message: error.message });
    }
  };
  

// update user cart 
const updateCart = async (req, res) => {
    try {
      const { userId, itemId, size, quantity } = req.body;
      const userData = await userModel.findById(userId);
  
      // Initialize `cartData` if it doesn't exist
      let cartData = userData.cartData || {};
  
      // Ensure the item and size exist before updating
      if (cartData[itemId]) {
        cartData[itemId][size] = quantity;
      } else {
        return res.json({ success: false, message: "Item not found in cart" });
      }
  
      // Update the user with the modified `cartData`
      await userModel.findByIdAndUpdate(userId, { cartData });
      res.json({ success: true, message: "Cart Updated" });
  
    } catch (error) {
      console.log(error);
      res.json({ success: false, message: error.message });
    }
  };
  

// get user cart  data
const getUserCart = async (req,res)=>{

    try {
        const {userId} = req.body

        const userData= await userModel.findById(userId)
        let cartData = await userData.cartData;

        res.json({success:true,cartData})
        
    } catch (error) {

        console.log(error);
        res.json({success:false,message:error.message})        
        
    }
    
}

export {addToCart,updateCart,getUserCart}

