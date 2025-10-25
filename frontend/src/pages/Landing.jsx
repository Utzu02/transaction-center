import { useNavigate } from "react-router-dom";
import Hero from "../components/landing/Hero";

const Landing = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/dashboard");
  };

  return (
    <>
      <Hero onGetStarted={handleGetStarted} />
    </>
  );
};

export default Landing;
