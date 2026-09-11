import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button"


export default function Login() {
  const { register, handleSubmit, formState:{errors} } = useForm();

  const { signIn } = useAuth();

  const navigate = useNavigate();

  const [serverError, setServerError] = useState("");

  const onSubmit = async values => {
    try{
      setServerError("");
      await signIn(values);
      navigate("/dashboard");
    }catch(err){
      setServerError(
        err.response?.data?.message || "Something went wrong"
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-(--bg)">
      <div className="w-full max-w-md border-2 bg-(--surface) p-8 border-(--border)">

        <h1 className="text-3xl font-bold">Login</h1>

        <p className="mt-2 text-sm text-(--muted)">
          Don’t have an account?{" "}
          <Link to="/signup" className="underline">
            Sign up
          </Link>
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-8 space-y-5"
        >

          <Input
            label="Email"
            type="email"
            register={register("email",{
              required:"Email required"
            })}
            error={errors.email?.message}
          />

          <Input
            label="Password"
            type="password"
            register={register("password",{
              required:"Password required"
            })}
            error={errors.password?.message}
          />

          {serverError && (
            <p className="text-red-500 text-sm">{serverError}</p>
          )}

          <Button>Login</Button>

        </form>
      </div>
    </div>
  );
}