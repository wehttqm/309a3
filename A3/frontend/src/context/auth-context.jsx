import React, { createContext, useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    // TODO: Update fetch for A3
    const key = localStorage.getItem("token")
    async function get_user() {
      const res = await fetch(BACKEND_URL + "/user/me", {
        headers: {
          Authorization: `Bearer ${key}`,
        },
      })
      if (res.status === 200) {
        const usr = await res.json()
        setUser(usr.user)
      } else {
        const err = await res.json()
        return err.message
      }
    }
    if (key) get_user()
    else setUser(null)
  }, [])

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
    navigate("/")
  }

  const login = async (username, password) => {
    // TODO: Update fetch for A3
    const res = await fetch(BACKEND_URL + "/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    })
    if (res.status === 200) {
      const data = await res.json()
      localStorage.setItem("token", data.token)

      const userRes = await fetch(BACKEND_URL + "/user/me", {
        headers: {
          Authorization: `Bearer ${data.token}`,
        },
      })

      const userData = await userRes.json()
      setUser(userData.user)

      navigate("/profile")
    } else {
      const err = await res.json()
      return err.message
    }
  }

  const register = async (userData) => {
    // TODO: Update fetch for A3
    const res = await fetch(BACKEND_URL + "/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...userData,
      }),
    })
    if (res.status === 201) {
      navigate("/success")
    } else {
      const err = await res.json()
      return err.message
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}
