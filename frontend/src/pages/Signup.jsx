import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import useDebounce from "../hooks/useDebounce";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { useEffect } from "react";
import api from "../api/axios";

export default function Signup() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    watch,
  } = useForm();

  const { signup } = useAuth();
  const username = watch("username");
  const debounced = useDebounce(username);

  const navigate = useNavigate();

  const [serverError, setServerError] = useState("");

  const checkUsernameAvailability = async (username) => {
   
    try {
      const response = await api.get(
        `/auth/check-username?username=${debounced}`,
      );
      if (response.status==200 && response.data.isAvailable) {
        clearErrors("username");
      } else {
        setError("username", {
          type: "manual",
          message: "This username is already taken",
        });
      }
    } catch (error) {
      console.error("Error checking username availability: ", error);
    } 
  };

  useEffect(() => {
    if (!debounced) return;
    checkUsernameAvailability(debounced);
  }, [debounced]);

  const onSubmit = async (values) => {
    try {
        console.log(values)
      await signup(values);
      navigate("/login");
    } catch (err) {
      setServerError(err?.response?.data?.message);
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-(--bg)">
      <div className="w-full max-w-md border-2 bg-(--surface) p-8 border-(--border)">
        <h1 className="text-3xl font-bold">Login</h1>

        <p className="mt-2 text-sm text-(--muted)">
          have an account?{" "}
          <Link to="/login" className="underline">
            Log in
          </Link>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          <Input
            label="username"
            type="username"
            register={register("username", {
              required: "username required",
              pattern: {
                value: /^[a-z0-9_]+$/,
                message: "Only lowercase letters, numbers and _",
              },
            })}
            error={errors.username?.message}
          />
          <Input
            label="Email"
            type="email"
            register={register("email", {
              required: "Email required",
            })}
            error={errors.email?.message}
          />

          <Input
            label="Password"
            type="password"
            register={register("password", {
              required: "Password required",
            })}
            error={errors.password?.message}
          />

          {serverError && <p className="text-red-500 text-sm">{serverError}</p>}

          <Button>signup</Button>
        </form>
      </div>
    </div>
  );
}
