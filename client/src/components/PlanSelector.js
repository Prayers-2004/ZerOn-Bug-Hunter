import React from 'react';
import '../styles/PlanSelector.css';

function PlanSelector({ selectedPlan, onPlanChange }) {
  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 'Free',
      description: 'Getting started',
      features: ['10 Endpoints', '100 Payloads', 'Basic Reports']
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$99/mo',
      description: 'Most Popular',
      features: ['100 Endpoints', '1000 Payloads', 'Real-time Dashboard', 'API Access']
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$999/mo',
      description: 'Full Power',
      features: ['1000 Endpoints', '5000 Payloads', 'Priority Support', 'Custom Integration']
    }
  ];

  return (
    <div className="plan-selector">
      <h3>Select Your Plan</h3>
      <div className="plans-grid">
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''}`}
            onClick={() => onPlanChange(plan.id)}
          >
            <h4>{plan.name}</h4>
            <p className="price">{plan.price}</p>
            <p className="description">{plan.description}</p>
            <ul className="features">
              {plan.features.map((feature, idx) => (
                <li key={idx}>✓ {feature}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlanSelector;
