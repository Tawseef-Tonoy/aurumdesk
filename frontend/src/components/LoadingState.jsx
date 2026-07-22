function LoadingState({ message = "Loading..." }) {
  return (
    <div className="text-center py-5">
      <div
        className="spinner-border"
        role="status"
      />

      <p className="text-muted mt-3 mb-0">
        {message}
      </p>
    </div>
  );
}

export default LoadingState;