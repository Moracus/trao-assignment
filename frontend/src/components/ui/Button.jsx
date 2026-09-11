 const Button =({ children, ...props })=> {
  return (
    <button
      {...props}
      className="w-full border-2 border-[(--border)] bg-[(--accent)] py-3 font-medium text-[(--bg)] transition hover:translate-x-1 hover:-translate-y-1 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export default Button;



