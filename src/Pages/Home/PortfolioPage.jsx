import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Home from "./Homescreen";
import Loading from "./Loading";

export default function PortfolioPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = "Daniel Brambila | Portfolio";
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Loading isVisible={isLoading} />
      <div className={`main-content ${isLoading ? "hidden" : "visible"}`}>
        <Navbar />
        <Home />
      </div>
    </>
  );
}
