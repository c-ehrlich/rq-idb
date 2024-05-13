import { useState } from "react";
import { useFruitsStore } from "./hooks/useFruitsStore";
import { IdbTest } from "./IdbTest";

function IndexedDb() {
  const [fruit, setFruit] = useState("");
  const {
    isLoading,
    isReady,
    addFruit,
    fruits,
    deleteFruit,
    isAddFruitPending,
  } = useFruitsStore();
  return (
    <div>
      <IdbTest />
      <h2>IndexedDb</h2>
      Status: {isLoading ? "connecting..." : isReady ? "connected" : "n/a"}
      <div>
        <label>Fruit</label>
        <input
          type="text"
          value={fruit}
          onChange={(e) => {
            setFruit(e.target.value);
          }}
        />
        <button
          type="button"
          onClick={async () => {
            if (!fruit) {
              alert("Enter fruit name");
              return;
            }
            await addFruit(fruit);
            setFruit("");
          }}
        >
          {isAddFruitPending ? "Adding..." : "Add Fruit"}
        </button>

        <ul>
          {fruits.map((fruit) => {
            return (
              <li key={fruit.fruitid}>
                <span>{fruit.name}</span>
                <button
                  onClick={async () => {
                    await deleteFruit(fruit.fruitid);
                  }}
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default IndexedDb;
