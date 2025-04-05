/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import Search from "./components/Search";
import Spinner from "./components/Spinner";
import MoiveCard from "./components/MoiveCard";
import { useDebounce } from "react-use";
import { updateSearchCount, getTrendingMovies } from "./appwrite";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

const App = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [error, setError] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

  const fetchMovies = async (query = "") => {
    setLoading(true);
    setError("");
    try {
      setLoading(true);
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      const response = await fetch(endpoint, API_OPTIONS);
      if (!response.ok) {
        throw new Error("Failed to fetch movies");
      }
      const data = await response.json();
      if (data.Response === "False") {
        setError(
          data.Error ?? "Failed to fetch movies please try again later."
        );
        setLoading(false);
        return;
      }

      setMovies(data.results);

      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }

      setLoading(false);

      console.log(data.results);
    } catch (error) {
      console.error("Error fetching movies:", error);
      setError("Failed to fetch movies please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    try {
      const trendMovies = await getTrendingMovies();

      setTrendingMovies(trendMovies);

      console.log(trendMovies);
    } catch (error) {
      console.error("Error fetching trending movies:", error);
    }
  };

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
  }
  , []);
  return (
    <main>
      <div className="pattern">
        <div className="wrapper">
          <header>
            <img src="hero.png" alt="Hero Banner" />
            <h1>
              Find <span className="text-gradient">Movies</span> You'll Enjoy
              without the Hassel
            </h1>
            <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </header>
          {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>

            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                   <p>{index + 1}</p>
                  <img src={movie.poster_path} title={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}

          <section className="all-movies">
            <h2 className="mb-[40px]">Popular Movies</h2>
            {loading ? (
              <Spinner />
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <ul>
                {movies.map((movie) => (
                  <MoiveCard key={movie.id} movie={movie} />
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

export default App;
