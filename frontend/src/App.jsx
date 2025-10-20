import React, { useState } from "react";
import { Button } from "./components/ui/button";

const App = () => {
  const [count, setCount] = useState(0);

  const handlevent = () => {
    setCount(count + 1);
  };

  return (
    <div className=" grid place-items-center h-screen gap-4">
      <p className="font-bold text-xl">Buil the APP</p>
      <Button variant="outline" onClick={handlevent}>
        Keep the distance
      </Button>
      <p>HERE IS THE TOTAL COUNT {count}</p>
    </div>
  );
};

export default App;
