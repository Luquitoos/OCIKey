import styles from './styles/gabarito.module.css';

export default function GabaritoDisplay({ 
  gabarito, 
  gabaritoCorreto = null, 
  showComparison = false,
  size = 'medium' 
}) {
  if (!gabarito) return null;

  const getAlternativeStyle = (char, index) => {
    let backgroundColor = '#ffffff';
    let borderColor = '#000000';
    let textColor = '#000000';
    
    // Se for comparação e temos gabarito correto
    if (showComparison && gabaritoCorreto) {
      const charCorreto = gabaritoCorreto[index];
      
      if (char === charCorreto && char !== 'X' && char !== '-') {
        // Resposta correta - circunferência verde
        backgroundColor = '#ffffff';
        borderColor = '#16a34a'; // verde
        textColor = '#000000';
      } else if (char === 'X' || char === '-') {
        // Erro de leitura - circunferência cinza
        backgroundColor = '#ffffff';
        borderColor = '#6b7280'; // cinza
        textColor = '#6b7280';
      } else {
        // Resposta incorreta - circunferência vermelha
        backgroundColor = '#ffffff';
        borderColor = '#dc2626'; // vermelho
        textColor = '#000000';
      }
    } else {
      // Estilo padrão sem comparação
      if (char === 'X' || char === '-') {
        backgroundColor = '#ffffff';
        borderColor = '#6b7280'; // cinza
        textColor = '#6b7280';
      }
    }

    return {
      backgroundColor,
      borderColor,
      color: textColor,
    };
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small': return styles.small;
      case 'large': return styles.large;
      default: return styles.medium;
    }
  };

  return (
    <div className={`${styles.gabaritoContainer} ${getSizeClass()}`}>
      {gabarito.split('').map((char, index) => {
        const alternativeStyle = getAlternativeStyle(char, index);
        
        return (
          <div
            key={index}
            className={styles.alternativeCircle}
            style={alternativeStyle}
          >
            <span className={styles.questionNumber}>{index + 1}</span>
            <span className={styles.alternativeLetter}>
              {char.toUpperCase()}
            </span>
          </div>
        );
      })}
    </div>
  );
}