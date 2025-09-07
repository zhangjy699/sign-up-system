import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, 
  Users, 
  BookOpen, 
  MessageCircle, 
  Award, 
  TrendingUp,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

export const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <Calendar className="w-8 h-8 text-primary-600" />,
      title: 'Easy Scheduling',
      description: 'Book tutoring sessions with senior students at your convenience'
    },
    {
      icon: <Users className="w-8 h-8 text-primary-600" />,
      title: 'Peer Mentorship',
      description: 'Connect with experienced students for guidance and support'
    },
    {
      icon: <BookOpen className="w-8 h-8 text-primary-600" />,
      title: 'Course Support',
      description: 'Get help with specific courses and academic challenges'
    },
    {
      icon: <MessageCircle className="w-8 h-8 text-primary-600" />,
      title: 'Community Chat',
      description: 'Join discussions and share knowledge with peers'
    },
    {
      icon: <Award className="w-8 h-8 text-primary-600" />,
      title: 'Case Competitions',
      description: 'Prepare for competitions with experienced mentors'
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-primary-600" />,
      title: 'Career Guidance',
      description: 'Get insights on internships and career development'
    }
  ];

  const categories = [
    'Course Tutoring',
    'Case Competition Preparation',
    'Profile Coaching Sessions',
    'Market News Sharing',
    'FINA Free Chat',
    'Course Selection',
    'Books Sharing',
    'Internship Sharing'
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Connect, Learn, and Grow Together
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
              Join the FINA and QFIN community platform where junior students connect 
              with senior mentors for academic support, career guidance, and knowledge sharing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg">
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg">
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                  <Link to="/sessions" className="btn border-white text-white hover:bg-white hover:text-primary-600 btn-lg">
                    Browse Sessions
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform provides comprehensive tools and resources to help you 
              excel in your academic and professional journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Support Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get help across various academic and professional areas from experienced peers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((category, index) => (
              <div key={index} className="card p-4 text-center hover:shadow-md transition-shadow">
                <CheckCircle className="w-6 h-6 text-success-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">{category}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Getting started is simple. Follow these steps to begin your learning journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Create Your Profile
              </h3>
              <p className="text-gray-600">
                Sign up and create your profile, specifying your program and areas of interest.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Browse Sessions
              </h3>
              <p className="text-gray-600">
                Find available tutoring sessions that match your needs and schedule.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Connect & Learn
              </h3>
              <p className="text-gray-600">
                Book sessions, attend meetings, and build lasting connections with peers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of students who are already benefiting from peer-to-peer learning and mentorship.
          </p>
          {!isAuthenticated && (
            <Link to="/register" className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg">
              Sign Up Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};
