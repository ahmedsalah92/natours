/*eslint-disable*/
import axios from 'axios';

export const bookTour = async tourId => {
  const stripe = Stripe(
    'pk_test_51JzgpdBk2hS3b5Lb7ZuE2xRtHKyMrizRCQlbjZTbbmdsa7xaS7s7GSfUZRDONYA4r6LvjMMWZijWMQ1QgVoq6rIY00BPxcJLOy'
  );

  // 1) Get check-out session from API/Server
  const session = await axios(`http://127.0.0.1:3000/api/v1/booking/checkout-session/${tourId}`);
  console.log(session);

  // 2) Create checkout form nd charge credir card
  stripe.redirectToCheckout({
    sessionId: session.data.session.id
  });
};
