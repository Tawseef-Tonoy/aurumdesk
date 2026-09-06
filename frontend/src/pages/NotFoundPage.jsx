import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="text-center py-5">
      <h1 className="display-6">
        Page not found
      </h1>

      <Link
        to="/"
        className="btn btn-dark mt-3"
      >
        Return to dashboard
      </Link>
    </div>
  );
}

export default NotFoundPage;