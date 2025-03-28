import React, { useState, useEffect } from 'react';
import './App.css';

const ProductDisplay = () => (
  <section>
    <div className="product">
      <h3>Starter plan</h3>
      <h5>$20.00 / month</h5>
    </div>
    <form action="/create-checkout-session" method="POST">
      <input type="hidden" name="lookup_key" value="Starter_Plan-e9651b4" />
      <button type="submit">Checkout</button>
    </form>
  </section>
);

const SuccessDisplay = ({ sessionId }) => (
  <section>
    <h3>Subscription to starter plan successful!</h3>
    <form action="/create-portal-session" method="POST">
      <input type="hidden" name="session_id" value={sessionId} />
      <button type="submit">Manage your billing information</button>
    </form>
  </section>
);

const App = () => {
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('success')) {
      setSuccess(true);
      setSessionId(query.get('session_id'));
    }
    if (query.get('canceled')) {
      setSuccess(false);
      setMessage("Order canceled -- continue to shop around and checkout when you're ready.");
    }
  }, []);

  if (!success && message === '') {
    return <ProductDisplay />;
  } else if (success && sessionId !== '') {
    return <SuccessDisplay sessionId={sessionId} />;
  } else {
    return <p>{message}</p>;
  }
};

export default App;

const Logo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    width="14px"
    height="16px"
    viewBox="0 0 14 16"
    version="1.1"
  >
    <defs />
    <g id="Flow" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <g
        id="0-Default"
        transform="translate(-121.000000, -40.000000)"
        fill="#E184DF"
      >
        <path
          d="M127,50 L126,50 C123.238576,50 121,47.7614237 121,45 C121,42.2385763 123.238576,40 126,40 L135,40 L135,56 L133,56 L133,42 L129,42 L129,56 L127,56 L127,50 Z M127,48 L127,42 L126,42 C124.343146,42 123,43.3431458 123,45 C123,46.6568542 124.343146,48 126,48 L127,48 Z"
          id="Pilcrow"
        />
      </g>
    </g>
  </svg>
);