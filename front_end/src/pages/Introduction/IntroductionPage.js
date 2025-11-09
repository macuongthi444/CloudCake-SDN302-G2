import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Cake, Heart, Truck, Shield, Award, Users, ShoppingBag, Sparkles } from 'lucide-react';
import logo from '../../assets/Logo.jpg';

const IntroductionPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Cake className="text-blue-500" size={48} />,
      title: "Bánh Tươi Ngon",
      description: "100% nguyên liệu tươi, được làm mới hàng ngày, không chất bảo quản"
    },
    {
      icon: <Heart className="text-pink-500" size={48} />,
      title: "Đặt Làm Theo Yêu Cầu",
      description: "Tùy chỉnh bánh theo sở thích với nhiều hương vị, kích thước và trang trí"
    },
    {
      icon: <Truck className="text-green-500" size={48} />,
      title: "Giao Hàng Nhanh",
      description: "Giao hàng tận nơi trong ngày, đảm bảo bánh luôn tươi ngon khi đến tay bạn"
    },
    {
      icon: <Shield className="text-purple-500" size={48} />,
      title: "Chất Lượng Đảm Bảo",
      description: "Cam kết chất lượng sản phẩm, đổi trả miễn phí nếu không hài lòng"
    },
    {
      icon: <Award className="text-yellow-500" size={48} />,
      title: "Thợ Làm Bánh Chuyên Nghiệp",
      description: "Đội ngũ đầu bếp giàu kinh nghiệm, tạo ra những tác phẩm nghệ thuật ẩm thực"
    },
    {
      icon: <Users className="text-indigo-500" size={48} />,
      title: "Cộng Đồng Yêu Thích",
      description: "Hàng nghìn khách hàng tin tưởng và yêu thích sản phẩm của chúng tôi"
    }
  ];

  const stats = [
    { number: "1000+", label: "Khách hàng hài lòng" },
    { number: "5000+", label: "Bánh đã giao" },
    { number: "50+", label: "Loại bánh khác nhau" },
    { number: "98%", label: "Đánh giá 5 sao" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <img src={logo} alt="CloudCake" className="h-32" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
            Chào mừng đến với <span className="text-blue-600">CloudCake</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Thế giới bánh ngọt tươi ngon, được làm thủ công với tình yêu và sự tận tâm. 
            Chúng tôi mang đến những chiếc bánh tuyệt vời cho mọi dịp đặc biệt của bạn.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/products')}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <ShoppingBag size={24} />
              Khám phá sản phẩm
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-white text-blue-600 rounded-lg text-lg font-semibold hover:bg-gray-50 transition shadow-lg hover:shadow-xl border-2 border-blue-600"
            >
              Đăng ký bán hàng
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 px-4 bg-white bg-opacity-60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Về <span className="text-blue-600">CloudCake</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              CloudCake được thành lập với sứ mệnh mang đến những chiếc bánh ngọt chất lượng cao, 
              được làm từ những nguyên liệu tốt nhất và được tạo ra bởi những thợ làm bánh giàu kinh nghiệm. 
              Chúng tôi tin rằng mỗi chiếc bánh không chỉ là một món ăn, mà còn là một tác phẩm nghệ thuật 
              mang đến niềm vui và hạnh phúc cho mọi người.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Tại sao chọn <span className="text-blue-600">CloudCake</span>?
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Thành tích của chúng tôi
            </h2>
            <div className="w-24 h-1 bg-white mx-auto"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-lg opacity-90">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 px-4 bg-white bg-opacity-60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Quy trình đặt hàng
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Chọn sản phẩm</h3>
              <p className="text-gray-600 text-sm">Duyệt danh sách và chọn bánh yêu thích</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Tùy chỉnh</h3>
              <p className="text-gray-600 text-sm">Chọn size, hương vị và trang trí theo ý thích</p>
            </div>
            <div className="text-center">
              <div className="bg-pink-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-pink-600">3</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Thanh toán</h3>
              <p className="text-gray-600 text-sm">Thanh toán an toàn qua nhiều phương thức</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-green-600">4</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Nhận hàng</h3>
              <p className="text-gray-600 text-sm">Nhận bánh tươi ngon tại nhà</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <Sparkles className="mx-auto mb-6" size={64} />
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Sẵn sàng khám phá thế giới bánh ngọt?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Đặt hàng ngay để nhận được những chiếc bánh tươi ngon nhất từ CloudCake
          </p>
          <button
            onClick={() => navigate('/products')}
            className="px-10 py-4 bg-white text-purple-600 rounded-lg text-xl font-bold hover:bg-gray-100 transition shadow-xl hover:shadow-2xl transform hover:scale-105"
          >
            Đặt hàng ngay
          </button>
        </div>
      </section>
    </div>
  );
};

export default IntroductionPage;






