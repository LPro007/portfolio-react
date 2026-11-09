export default function AboutMe() {
  return (
    <section id="AboutMe" className="about--section">
      <div className="about--section--img">
        <img src="/img/hero_img.png" alt="About Me" />
      </div>
      <div className="hero--section--content--box about--section--box">
        <div className="hero--section--content">
          <p className="section--title">About</p>
          <h1 className="skills-section--heading">About Me</h1>
          <p className="hero--section-description">
            With over six years of experience as a Front-end Developer, 
            I’m passionate about creating intuitive UI/UX that users love. 
            My expertise in the leading frameworks React and Angular allows me to create high performing, high quality web systems.
          </p>
          {/* <p className="hero--section-description">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Autem
            officiis sit debitis omnis harum sed veniam quasi dicta accusamus
            recusandae?
          </p> */}
        </div>
      </div>
    </section>
  );
}
