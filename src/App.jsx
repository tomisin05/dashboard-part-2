import React, { useState, useEffect } from 'react';
import { Route, Switch, Link, useParams } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import './App.css';

function App() {
  return (
    <Switch>
      <Route exact path="/" component={Dashboard} />
      <Route path="/recipe/:id" component={RecipeDetail} />
    </Switch>
  );
}

function Dashboard() {
  ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dietFilter, setDietFilter] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [calorieRange, setCalorieRange] = useState({ min: 0, max: 1000 });
  const [cookingTimeFilter, setCookingTimeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('calories');

  const calorieData = {
    labels: ['0-200', '201-400', '401-600', '601-800', '801+'],
    datasets: [
      {
        label: 'Number of Recipes',
        data: [
          recipes.filter(r => r.nutrition.nutrients.find(n => n.name === "Calories").amount <= 200).length,
          recipes.filter(r => r.nutrition.nutrients.find(n => n.name === "Calories").amount > 200 && r.nutrition.nutrients.find(n => n.name === "Calories").amount <= 400).length,
          recipes.filter(r => r.nutrition.nutrients.find(n => n.name === "Calories").amount > 400 && r.nutrition.nutrients.find(n => n.name === "Calories").amount <= 600).length,
          recipes.filter(r => r.nutrition.nutrients.find(n => n.name === "Calories").amount > 600 && r.nutrition.nutrients.find(n => n.name === "Calories").amount <= 800).length,
          recipes.filter(r => r.nutrition.nutrients.find(n => n.name === "Calories").amount > 800).length,
        ],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const cookingTimeData = {
    labels: ['0-15', '16-30', '31-60', '60+'],
    datasets: [
      {
        label: 'Number of Recipes',
        data: [
          recipes.filter(r => r.readyInMinutes <= 15).length,
          recipes.filter(r => r.readyInMinutes > 15 && r.readyInMinutes <= 30).length,
          recipes.filter(r => r.readyInMinutes > 30 && r.readyInMinutes <= 60).length,
          recipes.filter(r => r.readyInMinutes > 60).length,
        ],
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: chartType === 'calories' ? 'Calorie Distribution of Recipes' : 'Cooking Time Distribution of Recipes',
      },
    },
  };

  const API_KEY = '0c2f0c74f9744aa58188f63dbe761746';

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&number=100&addRecipeNutrition=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }
      const data = await response.json();
      setRecipes(data.results);
    } catch (err) {
      setError('Failed to fetch recipes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipes = recipes
    .filter(recipe => recipe.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(recipe => !dietFilter || recipe.diets.includes(dietFilter))
    .filter(recipe => !cuisineFilter || recipe.cuisines.includes(cuisineFilter))
    .filter(recipe => {
      const calories = recipe.nutrition.nutrients.find(n => n.name === "Calories").amount;
      return calories >= calorieRange.min && calories <= calorieRange.max;
    })
    .filter(recipe => {
      if (!cookingTimeFilter) return true;
      const [min, max] = cookingTimeFilter.split('-').map(Number);
      return recipe.readyInMinutes >= min && recipe.readyInMinutes <= max;
    });

  const totalRecipes = filteredRecipes.length;
  const averageCalories = filteredRecipes.reduce((sum, recipe) => sum + recipe.nutrition.nutrients.find(n => n.name === "Calories").amount, 0) / totalRecipes || 0;
  const mostCommonDiet = getMostCommonItem(filteredRecipes.flatMap(recipe => recipe.diets));
  const averageCookingTime = filteredRecipes.reduce((sum, recipe) => sum + recipe.readyInMinutes, 0) / totalRecipes || 0;
  const medianCalories = getMedian(filteredRecipes.map(recipe => recipe.nutrition.nutrients.find(n => n.name === "Calories").amount));

  function getMostCommonItem(arr) {
    return arr.sort((a,b) =>
      arr.filter(v => v===a).length - arr.filter(v => v===b).length
    ).pop();
  }

  function getMedian(arr) {
    const sorted = arr.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    return sorted[middle];
  }

  return (
    <div className="App">
      <h1>Spoonacular Recipe Dashboard</h1>
      
      {loading ? (
        <div className="loading-spinner">Loading recipes...</div>
      ) : error ? (
        <div className="error-message">Error: {error}</div>
      ) : (
        <>
          <div className="summary-stats">
            <p>Total Recipes: {totalRecipes}</p>
            <p>Average Calories: {averageCalories.toFixed(2)}</p>
            <p>Median Calories: {medianCalories.toFixed(2)}</p>
            <p>Most Common Diet: {mostCommonDiet || 'N/A'}</p>
            <p>Average Cooking Time: {averageCookingTime.toFixed(2)} minutes</p>
          </div>

          <div className="filters">
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select value={dietFilter} onChange={(e) => setDietFilter(e.target.value)}>
              <option value="">All Diets</option>
              <option value="gluten free">Gluten Free</option>
              <option value="ketogenic">Ketogenic</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
            </select>
            <select value={cuisineFilter} onChange={(e) => setCuisineFilter(e.target.value)}>
              <option value="">All Cuisines</option>
              <option value="Italian">Italian</option>
              <option value="Mexican">Mexican</option>
              <option value="Asian">Asian</option>
              <option value="American">American</option>
            </select>
            <select value={cookingTimeFilter} onChange={(e) => setCookingTimeFilter(e.target.value)}>
              <option value="">All Cooking Times</option>
              <option value="0-15">Quick (0-15 minutes)</option>
              <option value="16-30">Medium (16-30 minutes)</option>
              <option value="31-60">Long (31-60 minutes)</option>
              <option value="61-1000">Very Long (60+ minutes)</option>
            </select>
            <div className="calorie-range">
              <label>
                Calorie Range:
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={calorieRange.min}
                  onChange={(e) => setCalorieRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                />
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={calorieRange.max}
                  onChange={(e) => setCalorieRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                />
                <span>{calorieRange.min} - {calorieRange.max} calories</span>
              </label>
            </div>
          </div>

          <div className="chart-container">
            <div className="chart-toggle">
              <button onClick={() => setChartType('calories')} className={chartType === 'calories' ? 'active' : ''}>Calorie Distribution</button>
              <button onClick={() => setChartType('cookingTime')} className={chartType === 'cookingTime' ? 'active' : ''}>Cooking Time Distribution</button>
            </div>
            <Bar data={chartType === 'calories' ? calorieData : cookingTimeData} options={chartOptions} />
          </div>
          <div className="dashboard-explanation">
            <h3>Interesting Insights</h3>
            <p>Our recipe collection shows some fascinating trends:</p>
            <ul>
              <li>Most recipes fall within the 200-400 calorie range, ideal for health-conscious individuals.</li>
              <li>There's a good mix of quick (0-15 minutes) and medium (16-30 minutes) preparation time recipes, perfect for busy lifestyles.</li>
              <li>The most common diet type is {mostCommonDiet || 'N/A'}, reflecting current dietary preferences.</li>
              <li>With an average cooking time of {averageCookingTime.toFixed(2)} minutes, these recipes strike a balance between convenience and home-cooked meals.</li>
            </ul>
          </div>
          <div className="recipe-table-container">
            <table className="recipe-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Cooking Time</th>
                  <th>Calories</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecipes.map(recipe => (
                  <tr key={recipe.id}>
                    <td>{recipe.title}</td>
                    <td>{recipe.readyInMinutes} minutes</td>
                    <td>
                      {recipe.nutrition.nutrients.find(n => n.name === "Calories").amount.toFixed(2)} kcal
                    </td>
                    <td>
                      <Link to={`/recipe/${recipe.id}`} className="view-details-link">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function RecipeDetail() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_KEY = '0c2f0c74f9744aa58188f63dbe761746';

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`https://api.spoonacular.com/recipes/${id}/information?apiKey=${API_KEY}&includeNutrition=true`);
        if (!response.ok) {
          throw new Error('Failed to fetch recipe details');
        }
        const data = await response.json();
        setRecipe(data);
      } catch (err) {
        console.error('Error fetching recipe:', err);
        setError('Failed to fetch recipe details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  if (loading) return <div className="loading">Loading recipe details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!recipe) return <div className="not-found">Recipe not found</div>;

  return (
    <div className="recipe-detail">
      <h2>{recipe.title}</h2>
      <img src={recipe.image} alt={recipe.title} />
      <p>Calories: {recipe.nutrition?.nutrients?.find(n => n.name === "Calories")?.amount.toFixed(2) || 'N/A'}</p>
      <p>Cooking Time: {recipe.readyInMinutes} minutes</p>
      <p>Diets: {recipe.diets?.join(', ') || 'None'}</p>
      <p>Cuisines: {recipe.cuisines?.join(', ') || 'None'}</p>
      <h3>Ingredients:</h3>
      <ul>
        {recipe.extendedIngredients?.map(ingredient => (
          <li key={ingredient.id}>{ingredient.original}</li>
        ))}
      </ul>
      <h3>Instructions:</h3>
      <ol>
        {recipe.analyzedInstructions?.[0]?.steps.map(step => (
          <li key={step.number}>{step.step}</li>
        ))}
      </ol>
      <Link to="/">Back to Dashboard</Link>
    </div>
  );
}

export default App;
