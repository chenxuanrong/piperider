import logging

def get_logger(name):
  # Create logger
  logger = logging.getLogger(name)
  logger.setLevel(logging.DEBUG)

  # Create file handler
  file_handler = logging.FileHandler('.piperider/logs/piperider.log')
  file_handler.setLevel(logging.DEBUG)

  # Create console handler
  console_handler = logging.StreamHandler()
  console_handler.setLevel(logging.INFO)

  # Create formatter
  formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

  # Set formatter for handlers
  file_handler.setFormatter(formatter)
  console_handler.setFormatter(formatter)

  # Add handlers to logger
  logger.addHandler(file_handler)
  logger.addHandler(console_handler)
  return logger
