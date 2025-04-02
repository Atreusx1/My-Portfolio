import React, { useRef, useEffect, useState } from 'react';

const Projects = () => {
  const projectsRef = useRef(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      },
      { threshold: 0.1 }
    );

    if (projectsRef.current) {
      observer.observe(projectsRef.current);
    }

    return () => {
      if (projectsRef.current) {
        observer.unobserve(projectsRef.current);
      }
    };
  }, []);

  const projects = [
    {
      id: 1,
      title: '3D Product Configurator',
      description: 'Interactive 3D product visualization with customization options using Three.js and React.',
      image: 'project1.jpg',
      technologies: ['React', 'Three.js', 'WebGL'],
      category: 'web',
      github: 'https://github.com',
      live: 'https://example.com',
    },
    {
      id: 2,
      title: 'E-commerce Dashboard',
      description: 'Admin dashboard for e-commerce with real-time analytics and inventory management.',
      image: 'project2.jpg',
      technologies: ['React', 'Node.js', 'MongoDB'],
      category: 'fullstack',
      github: 'https://github.com',
      live: 'https://example.com',
    },
    {
      id: 3,
      title: 'Interactive Data Visualization',
      description: 'Dynamic data visualization platform using D3.js and React with filtering capabilities.',
      image: 'project3.jpg',
      technologies: ['React', 'D3.js', 'Firebase'],
      category: 'web',
      github: 'https://github.com',
      live: 'https://example.com',
    },
    {
      id: 4,
      title: 'Mobile Banking App',
      description: 'Secure mobile banking application with transaction history and budget tracking.',
      image: 'project4.jpg',
      technologies: ['React Native', 'Node.js', 'MongoDB'],
      category: 'mobile',
      github: 'https://github.com',
      live: 'https://example.com',
    },
    {
      id: 5,
      title: 'Augmented Reality Experience',
      description: 'Web-based AR experience for product visualization using WebXR and Three.js.',
      image: 'project5.jpg',
      technologies: ['Three.js', 'WebXR', 'JavaScript'],
      category: 'ar',
      github: 'https://github.com',
      live: 'https://example.com',
    },
    {
      id: 6,
      title: 'Portfolio Website',
      description: 'Interactive developer portfolio with 3D elements and animations.',
      image: 'project6.jpg',
      technologies: ['React', 'Three.js', 'GSAP'],
      category: 'web',
      github: 'https://github.com',
      live: 'https://example.com',
    },
  ];

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(project => project.category === filter);

  return (
    <div className="section-container1" ref={projectsRef}>
      <h2 className="section-title">Recent Projects</h2>
      
      {/* <div className="project-filters">
        <button 
          className={filter === 'all' ? 'active' : ''} 
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={filter === 'web' ? 'active' : ''} 
          onClick={() => setFilter('web')}
        >
          Web
        </button>
        <button 
          className={filter === 'fullstack' ? 'active' : ''} 
          onClick={() => setFilter('fullstack')}
        >
          Fullstack
        </button>
        <button 
          className={filter === 'mobile' ? 'active' : ''} 
          onClick={() => setFilter('mobile')}
        >
          Mobile
        </button>
        <button 
          className={filter === 'ar' ? 'active' : ''} 
          onClick={() => setFilter('ar')}
        >
          AR/VR
        </button>
      </div> */}
      
      <div className="projects-grid">
        {filteredProjects.map((project) => (
          <div key={project.id} className="project-card">
            <div className="project-image">
              <div className="image-placeholder">
                <span>{project.title.substring(0, 2)}</span>
              </div>
            </div>
            <div className="project-content">
              <h3 className="project-title">{project.title}</h3>
              <p className="project-description">{project.description}</p>
              <div className="project-tech">
                {project.technologies.map((tech, index) => (
                  <span key={index} className="tech-tag">{tech}</span>
                ))}
              </div>
              <div className="project-links">
                <a href={project.github} target="_blank" rel="noopener noreferrer" className="project-link">
                  <i className="github-icon"></i> Code
                </a>
                <a href={project.live} target="_blank" rel="noopener noreferrer" className="project-link">
                  <i className="live-icon"></i> Live Demo
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;