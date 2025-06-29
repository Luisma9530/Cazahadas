import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/LoginStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isUnrolling, setIsUnrolling] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [setLogedUser, setPassword] = useAuthStore((state) => [ state.setLogedUser, state.setPassword]);


  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (isOpen) {
      setIsUnrolling(true);
      setTimeout(() => setShowContent(true), 1200);
    } else {
      setShowContent(false);
      setIsUnrolling(false);
      setNotification(null);
    }
  }, [isOpen]);

  const MONGODB_CONFIG = {
    PUBLIC_KEY: import.meta.env.MONGODB_PUBLIC_KEY || '',
    PRIVATE_KEY: import.meta.env.MONGODB_PRIVATE_KEY || '',
    PROJECT_ID: import.meta.env.MONGODB_PROJECT_ID || ''
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
    console.log(message)
  };

  const validateForm = (data: typeof registerData, isRegister: boolean): string | null => {
    if (!data.username.trim()) return 'El nombre de usuario es requerido';
    if (data.username.length < 3) return 'El nombre de usuario debe tener al menos 3 caracteres';
    if (!data.password) return 'La contraseña es requerida';
    if (data.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';

    if (isRegister) {
      if (!data.username.trim()) return 'El nombre de usuario es requerido';
      if (data.password !== data.confirmPassword) return 'Las contraseñas no coinciden';
    }

    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login data:", loginData);
    try {
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginData.username,
          password: loginData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ Login exitoso");
        console.log("Login data:", data);
        setLogedUser(data.username);
        setPassword(loginData.password);
        onClose();
      } else {
        alert("❌ Error de login: " + data.detail);
      }
    } catch (err) {
      console.error("Error en login:", err);
    }
  };



  const handleRegister = async () => {
    const validationError = validateForm(registerData, true);
    if (validationError) {
      showNotification('error', validationError);
      return;
    }
    try {
      const response = await fetch("http://localhost:8000/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: registerData.username,
          password: registerData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ Usuario creado con éxito");
        onClose();
      } else {
        alert("❌ Error: " + data);
      }
    } catch (err) {
      console.error("Error al crear usuario:", err);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="text-center">
        {isOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative max-w-md w-full max-h-[85vh]">

              {/* Rodillo Superior */}
              <div className="absolute -top-3 left-6 right-6 h-4 bg-gradient-to-r from-purple-800 via-pink-700 to-purple-800 rounded-full shadow-lg z-20 border-2 border-purple-900">
                <div className="absolute inset-0 bg-gradient-to-b from-pink-600 to-purple-800 rounded-full opacity-60"></div>
                <div className="absolute left-1 top-0.5 w-1.5 h-3 bg-purple-900 rounded-sm"></div>
                <div className="absolute right-1 top-0.5 w-1.5 h-3 bg-purple-900 rounded-sm"></div>
              </div>

              {/* Rodillo Inferior */}
              <div className="absolute -bottom-3 left-6 right-6 h-4 bg-gradient-to-r from-purple-800 via-pink-700 to-purple-800 rounded-full shadow-lg z-20 border-2 border-purple-900">
                <div className="absolute inset-0 bg-gradient-to-b from-pink-600 to-purple-800 rounded-full opacity-60"></div>
                <div className="absolute left-1 top-0.5 w-1.5 h-3 bg-purple-900 rounded-sm"></div>
                <div className="absolute right-1 top-0.5 w-1.5 h-3 bg-purple-900 rounded-sm"></div>
              </div>

              {/* Sombra del pergamino */}
              <div
                className={`absolute inset-0 bg-purple-900/20 -z-10 transition-all duration-1000 ease-out ${isUnrolling ? 'animate-unroll-shadow' : 'animate-roll-up-shadow'
                  }`}
                style={{
                  clipPath: 'polygon(2% 0%, 98% 1%, 99% 4%, 97% 8%, 99% 12%, 98% 96%, 95% 99%, 92% 97%, 8% 98%, 5% 96%, 1% 92%, 3% 8%, 1% 4%)',
                  filter: 'blur(8px)',
                  transform: 'rotate(0.5deg) translate(4px, 6px)',
                  transformOrigin: 'top center'
                }}
              />

              {/* Pergamino Principal */}
              <div
                className={`
                  relative bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 shadow-2xl transform rotate-1
                  transition-all duration-1000 ease-out overflow-hidden
                  ${isUnrolling ? 'animate-unroll' : 'animate-roll-up'}
                `}
                style={{
                  clipPath: 'polygon(2% 0%, 98% 1%, 99% 4%, 97% 8%, 99% 12%, 98% 96%, 95% 99%, 92% 97%, 8% 98%, 5% 96%, 1% 92%, 3% 8%, 1% 4%)',
                  filter: 'drop-shadow(0 10px 20px rgba(139, 69, 19, 0.3))',
                  transformOrigin: 'top center'
                }}
              >
                {/* Textura de pergamino */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      radial-gradient(circle at 20% 30%, rgba(139, 69, 19, 0.1) 2px, transparent 2px),
                      radial-gradient(circle at 80% 70%, rgba(160, 82, 45, 0.08) 1px, transparent 1px),
                      radial-gradient(circle at 40% 80%, rgba(139, 69, 19, 0.06) 1.5px, transparent 1.5px),
                      linear-gradient(45deg, transparent 48%, rgba(139, 69, 19, 0.03) 49%, rgba(139, 69, 19, 0.03) 51%, transparent 52%)
                    `,
                    backgroundSize: '50px 50px, 30px 30px, 70px 70px, 20px 20px',
                  }}
                />

                {/* Bordes quemados/envejecidos */}
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: `
                      linear-gradient(to right, rgba(139, 69, 19, 0.2) 0%, transparent 5%),
                      linear-gradient(to left, rgba(139, 69, 19, 0.2) 0%, transparent 5%),
                      linear-gradient(to bottom, rgba(139, 69, 19, 0.2) 0%, transparent 5%),
                      linear-gradient(to top, rgba(139, 69, 19, 0.2) 0%, transparent 5%)
                    `
                  }}
                />

                {/* Contenido del pergamino */}
                <div className={`
                  relative p-6 md:p-8 transition-all duration-700 ease-out delay-300 max-h-[70vh] overflow-y-auto
                  ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                `}>
                  {/* Botón cerrar en esquina */}
                  <button
                    onClick={onClose}
                    className="sticky top-0 float-right w-8 h-8 rounded-full bg-purple-200/80 border-2 border-purple-600 text-purple-800 font-bold hover:scale-110 hover:bg-purple-300/80 transition-all duration-200 shadow-md z-10 mb-4"
                    title="Cerrar"
                  >
                    ×
                  </button>

                  {/* Ornamento superior */}
                  <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-3 text-purple-800">
                      <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-purple-600 to-purple-600"></div>
                      <User className="w-8 h-8 text-purple-600" />
                      <div className="w-16 h-0.5 bg-gradient-to-l from-transparent via-purple-600 to-purple-600"></div>
                    </div>
                  </div>

                  {/* Pestañas */}
                  <div className="flex mb-6 bg-purple-100 rounded-lg p-1">
                    <button
                      onClick={() => setActiveTab('login')}
                      className={`flex-1 py-2 px-4 rounded-md font-semibold transition-all duration-200 ${activeTab === 'login'
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'text-purple-600 hover:bg-purple-200'
                        }`}
                    >
                      Iniciar Sesión
                    </button>
                    <button
                      onClick={() => setActiveTab('register')}
                      className={`flex-1 py-2 px-4 rounded-md font-semibold transition-all duration-200 ${activeTab === 'register'
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'text-purple-600 hover:bg-purple-200'
                        }`}
                    >
                      Crear Cuenta
                    </button>
                  </div>

                  {/* Contenido de las pestañas */}
                  {activeTab === 'login' ? (
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold text-center text-purple-900 mb-4 font-serif">
                        Bienvenido de vuelta
                      </h2>

                      <div className="space-y-4">
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 w-5 h-5" />
                          <input
                            type="text"
                            placeholder="Nombre de usuario"
                            className="w-full pl-10 pr-4 py-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none bg-white/90"
                            value={loginData.username}
                            onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                          />
                        </div>

                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 w-5 h-5" />
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Contraseña"
                            className="w-full pl-10 pr-12 py-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none bg-white/90"
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-500 hover:text-purple-700"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleLogin}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        Iniciar Sesión ✨
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold text-center text-purple-900 mb-4 font-serif">
                        Únete a la aventura
                      </h2>

                      <div className="space-y-4">
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 w-5 h-5" />
                          <input
                            type="text"
                            placeholder="Nombre de usuario"
                            className="w-full pl-10 pr-4 py-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none bg-white/90"
                            value={registerData.username}
                            onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                          />
                        </div>

                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 w-5 h-5" />
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Contraseña"
                            className="w-full pl-10 pr-12 py-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none bg-white/90"
                            value={registerData.password}
                            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-500 hover:text-purple-700"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>

                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 w-5 h-5" />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirmar contraseña"
                            className="w-full pl-10 pr-12 py-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none bg-white/90"
                            value={registerData.confirmPassword}
                            onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-500 hover:text-purple-700"
                          >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleRegister}
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        Crear Cuenta ✨
                      </button>

                      <div className="text-center text-xs text-purple-600">
                        Al crear una cuenta aceptas nuestros términos y condiciones
                      </div>
                    </div>
                  )}

                  {/* Ornamento inferior */}
                  <div className="flex justify-center my-6">
                    <div className="text-purple-600 text-lg">❦</div>
                  </div>
                </div>

                {/* Efectos de sombra interna */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    boxShadow: 'inset 0 0 60px rgba(139, 69, 19, 0.1), inset 0 0 20px rgba(160, 82, 45, 0.1)'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes unroll {
          0% {
            height: 0;
            transform: rotate(1deg) scaleY(0);
          }
          50% {
            height: 400px;
            transform: rotate(1deg) scaleY(0.8);
          }
          100% {
            height: auto;
            transform: rotate(1deg) scaleY(1);
          }
        }
        
        @keyframes roll-up {
          0% {
            height: auto;
            transform: rotate(1deg) scaleY(1);
          }
          50% {
            height: 200px;
            transform: rotate(1deg) scaleY(0.5);
          }
          100% {
            height: 0;
            transform: rotate(1deg) scaleY(0);
          }
        }

        @keyframes unroll-shadow {
          0% {
            height: 0;
            transform: rotate(0.5deg) translate(4px, 6px) scaleY(0);
          }
          50% {
            height: 400px;
            transform: rotate(0.5deg) translate(4px, 6px) scaleY(0.8);
          }
          100% {
            height: auto;
            transform: rotate(0.5deg) translate(4px, 6px) scaleY(1);
          }
        }
        
        @keyframes roll-up-shadow {
          0% {
            height: auto;
            transform: rotate(0.5deg) translate(4px, 6px) scaleY(1);
          }
          50% {
            height: 200px;
            transform: rotate(0.5deg) translate(4px, 6px) scaleY(0.5);
          }
          100% {
            height: 0;
            transform: rotate(0.5deg) translate(4px, 6px) scaleY(0);
          }
        }
        
        .animate-unroll {
          animation: unroll 1s ease-out forwards;
        }
        
        .animate-roll-up {
          animation: roll-up 0.8s ease-in forwards;
        }

        .animate-unroll-shadow {
          animation: unroll-shadow 1s ease-out forwards;
        }
        
        .animate-roll-up-shadow {
          animation: roll-up-shadow 0.8s ease-in forwards;
        }
      `}</style>
    </div>
  );
};

export default AuthModal;