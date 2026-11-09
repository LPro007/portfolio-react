export default function HeroSection() {
  return (
    <section id="heroSection" className="hero--section">
      <div className="hero--section--img">
        <img src="/img/hero_img.png" alt="Hero Section" />
      </div>
      <div className="hero--section--content--box">
        <div className="hero--section--content">
          <p className="section--title">Hey, I'm Daniel</p>
          <h1 className="hero--section--title">
            <span className="hero--section-title--color">Frontend Engineer</span>
          </h1>
          <p className="hero--section-description">
          I Craft Seamless UX with Modern Technologies
          </p>
          <p className="hero--section-description hero--section-description__smaller">
          Based in San Diego, California  |  Driven by a Passion for Learning
          </p>
        </div>
        {/* <button className="btn btn-primary">Get In Touch</button> */}
      </div>
    </section>
  );
}
