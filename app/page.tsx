"use client";

import { useState } from "react";

const Arrow = () => <span aria-hidden="true">↗</span>;
const Check = () => <span className="check" aria-hidden="true">✓</span>;

const features = [
  {
    num: "01",
    title: "AI Influencers",
    text: "Create hyper-realistic AI models with their own face, body, and personality — and keep the same face on every single generation.",
    image: "/assets/model-1.jpg",
  },
  {
    num: "02",
    title: "Motion Control",
    text: "Transfer motion from a reference video to any character. Perfect lip sync, synced expressions, and fluid gestures.",
    accent: true,
  },
  {
    num: "03",
    title: "Full HD Images",
    text: "Generate professional high-definition photos with realistic lighting, cinematic composition, and crisp detail.",
    image: "/assets/model-2.jpg",
  },
  {
    num: "04",
    title: "Ultra-Realistic Videos",
    text: "Access the best generation models in one place. Cinema-grade quality, natural motion, and realistic physics.",
    accent: true,
  },
];

const stack = [
  ["ChatGPT Pro", "Sora 2 + Image 2", "$200/mo"],
  ["Google Flow Ultra", "Veo 3.1 + Nano Banana", "$250/mo"],
  ["Magnific AI", "Skin Enhancer + Upscale 4K", "$98/mo"],
  ["Kling AI Pro", "Kling + Motion Control", "$36/mo"],
  ["ElevenLabs Pro", "Audio + Voiceovers", "$98/mo"],
  ["X Premium+", "Super Grok Imagine", "$40/mo"],
];

const plans = [
  {
    name: "Starter",
    desc: "For your first AI model",
    price: "$2.90",
    credits: "1,000 credits / month",
    features: ["Consistent AI model", "HD image generation", "Video generation", "Commercial usage"],
  },
  {
    name: "Creator",
    desc: "For creators ready to scale",
    price: "$19",
    credits: "10,000 credits / month",
    features: ["Everything in Starter", "Motion control", "Priority generation", "No watermarks", "Extra credit packs"],
    popular: true,
  },
  {
    name: "Agency",
    desc: "For multi-account operations",
    price: "$49",
    credits: "30,000 credits / month",
    features: ["Everything in Creator", "Multiple AI personas", "Ultra-realistic video", "Team-ready workflow", "Priority support"],
  },
];

const audiences = [
  ["01", "Solo Fanvue Creators", "Launch your first AI model without showing your face and without hiring anyone."],
  ["02", "OFM Operators", "Manage several models at once with content running on an assembly line."],
  ["03", "OFM Agencies", "Multiply accounts without bloating your team or production costs."],
  ["04", "Chatters & Managers", "Always have fresh, consistent content on hand to keep subscribers engaged."],
];

const testimonials = [
  ["LF", "Lucas Ferreira", "@lucasferreira.ai · OFM Operator", "I scaled from 1 to 6 models in two months. The face comes out identical on every generation."],
  ["MC", "Mariana Costa", "@maricosta.digital · Fanvue Creator", "I launched without showing my face and hit my first subscriber goal in 3 weeks."],
  ["RS", "Rafael Souza", "@rafasouza.mkt · OFM Agency", "We feed 12 accounts with a lean team. The content assembly line protects our margin."],
];

const faqs = [
  ["How do I get started?", "Create your account in under 2 minutes, pick a plan, and you'll instantly get credits to generate your first AI model."],
  ["Do I need to install anything?", "No. The AI Model Lab runs 100% online in your browser, on desktop and mobile."],
  ["Can I use the content to monetize on Fanvue?", "Yes. The platform is built to feed Fanvue and other subscription platforms, subject to each platform's rules."],
  ["Do videos have a watermark?", "Not on paid plans. All content you generate is yours and ready to publish."],
  ["Can I keep the same face across every generation?", "Yes. Lock your model's identity and keep a recognizable, consistent face across photos and videos."],
  ["Can I cancel anytime?", "Yes. There are no penalties or cancellation fees, and access continues through your paid period."],
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main>
      <header className="nav shell">
        <a className="brand" href="#" aria-label="The AI Model Lab home">
          <img src="/assets/logo.png" alt="" />
        </a>
        <nav className={menuOpen ? "navlinks open" : "navlinks"} aria-label="Main navigation">
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#results" onClick={() => setMenuOpen(false)}>Results</a>
          <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
        </nav>
        <div className="nav-actions">
          <a className="button ghost" href="#pricing">Sign in</a>
          <a className="button primary" href="#pricing">Start Now</a>
        </div>
        <button className="menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation" aria-expanded={menuOpen}>
          <span /><span />
        </button>
      </header>

      <section className="hero shell">
        <div className="orb orb-one" />
        <div className="eyebrow">The AI model factory for OFM agencies</div>
        <h1>Build and scale AI<br />models that earn on<br /><span>Fanvue.</span></h1>
        <p>Create dozens of hyper-realistic personas with a 100% consistent face and mass-produce content to feed every account. No real models, no photographer, no bloating your team.</p>
        <a className="button primary hero-cta" href="#pricing">Create your first model <Arrow /></a>
        <div className="micro"><span className="pulse" /> Your first model ready in under 2 minutes</div>
      </section>

      <section className="stats shell">
        {["+2,000 Active Creators", "+1.8M Images Generated", "+310K Videos Created"].map((item) => {
          const [value, ...label] = item.split(" ");
          return <div className="stat" key={item}><strong>{value}</strong><span>{label.join(" ")}</span></div>;
        })}
      </section>

      <section className="section shell" id="features">
        <div className="section-head">
          <div>
            <div className="kicker">Everything for your OFM operation</div>
            <h2>A full assembly line to build and scale your AI models.</h2>
          </div>
          <p>Consistent face, photos, videos, motion, and voice — all with AI, all in one place, ready to feed Fanvue.</p>
        </div>
        <div className="feature-grid">
          {features.map((item) => (
            <article className={`feature-card ${item.accent ? "accent-card" : ""}`} key={item.title}>
              {item.image ? <img src={item.image} alt="" /> : <div className="motion-art"><div className="rings" /><div className="play">▶</div></div>}
              <div className="feature-copy">
                <span>{item.num}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section comparison" id="results">
        <div className="shell split">
          <div className="sticky-copy">
            <div className="kicker">Why The AI Model Lab</div>
            <h2>Running an OFM operation used to cost a fortune. <span>Now it costs pennies.</span></h2>
            <p>One simple workspace replaces the stack of subscriptions that slows your production down.</p>
          </div>
          <div className="stack-card">
            {stack.map(([name, sub, price]) => (
              <div className="stack-row" key={name}>
                <div className="app-icon">{name.slice(0, 1)}</div>
                <div><strong>{name}</strong><span>{sub}</span></div>
                <b>{price}</b>
              </div>
            ))}
            <div className="total">
              <span>Total if bought separately</span>
              <strong>~$745/mo</strong>
            </div>
            <p>Here you get <b>everything</b> in a single plan — for just a fraction of that.</p>
          </div>
        </div>
      </section>

      <section className="section shell" id="pricing">
        <div className="center-head">
          <div className="kicker">Pricing</div>
          <h2>Choose the production capacity behind your offer.</h2>
          <p>Start small, prove your model, then scale when output becomes the limit.</p>
        </div>
        <div className="plans">
          {plans.map((plan) => (
            <article className={`plan ${plan.popular ? "popular" : ""}`} key={plan.name}>
              {plan.popular && <span className="popular-label">Most popular</span>}
              <h3>{plan.name}</h3>
              <p>{plan.desc}</p>
              <div className="price"><strong>{plan.price}</strong><span>/ month</span></div>
              <div className="credits">{plan.credits}</div>
              <a href="#cta" className={`button ${plan.popular ? "primary" : "ghost"}`}>Choose {plan.name} <Arrow /></a>
              <ul>{plan.features.map((f) => <li key={f}><Check />{f}</li>)}</ul>
            </article>
          ))}
        </div>
        <div className="reassurance"><span>✓ No cancellation fee</span><span>⌁ Secure payment</span><span>↻ Credits renew monthly</span></div>
      </section>

      <section className="section audience">
        <div className="shell">
          <div className="section-head">
            <div><div className="kicker">Who it&apos;s for</div><h2>From your first model to an agency with dozens of accounts.</h2></div>
          </div>
          <div className="audience-grid">
            {audiences.map(([n, title, text]) => <article key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p><Arrow /></article>)}
          </div>
        </div>
      </section>

      <section className="section shell testimonials">
        <div className="center-head"><div className="kicker">What people say</div><h2>Real operators. Real accounts.</h2></div>
        <div className="quotes">
          {testimonials.map(([initials, name, handle, quote]) => (
            <article key={name}><div className="quote-mark">“</div><p>{quote}</p><div className="person"><span>{initials}</span><div><strong>{name}</strong><small>{handle}</small></div></div></article>
          ))}
        </div>
      </section>

      <section className="section shell faq" id="faq">
        <div className="faq-intro"><div className="kicker">Questions</div><h2>Frequently Asked Questions</h2><p>Everything you need to know before getting started.</p></div>
        <div className="faq-list">
          {faqs.map(([q, a], i) => (
            <article className={openFaq === i ? "faq-item open" : "faq-item"} key={q}>
              <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} aria-expanded={openFaq === i}><span>{q}</span><b>{openFaq === i ? "−" : "+"}</b></button>
              <div className="answer"><p>{a}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="cta shell" id="cta">
        <div className="orb orb-two" />
        <div className="avatars"><span>LF</span><span>MC</span><span>RS</span><span>CO</span><b>+2K</b></div>
        <h2>Ready to launch your first<br />AI model on Fanvue?</h2>
        <p>Join the operators and agencies already scaling with a 100% consistent face.</p>
        <a className="button primary" href="#pricing">Start Now <Arrow /></a>
        <small>2-minute setup · Cancel anytime</small>
      </section>

      <footer>
        <div className="shell footer-grid">
          <div className="footer-brand"><img src="/assets/logo.png" alt="" /><strong>The AI Model Lab</strong><p>Create professional AI influencers, videos, and images.</p></div>
          <div><h4>Product</h4><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#results">Results</a><a href="#faq">FAQ</a></div>
          <div><h4>Company</h4><a href="#">About</a><a href="#">Contact</a></div>
          <div><h4>Legal</h4><a href="#">Terms of Service</a><a href="#">Privacy Policy</a></div>
        </div>
        <div className="shell copyright">© 2026 The AI Model Lab. All rights reserved.<span>Instagram · TikTok</span></div>
      </footer>

      <a className="support" href="https://wa.me/5511943735978" aria-label="Support via WhatsApp">↗</a>
    </main>
  );
}
