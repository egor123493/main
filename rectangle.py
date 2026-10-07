import unittest
def area(a, b):
    '''
    Возвращает площадь прямоугольника.

    Параметры:
        a (float): длина первой стороны
        b (float): длина второй стороны

    Возвращаемое значение:
        float: площадь прямоугольника (a * b)

    Пример вызова:
        area(3, 4)  # 12
    '''
    return a * b


def perimeter(a, b):
    '''
    Возвращает периметр прямоугольника.

    Параметры:
        a (float): длина первой стороны
        b (float): длина второй стороны

    Возвращаемое значение:
        float: периметр прямоугольника (2 * (a + b))

    Пример вызова:
        perimeter(3, 4)  # 14
    '''
    return 2 * (a + b)
class RectangleTestCase(unittest.TestCase):
   def test_zero_mul(self):
       res = area(10, 0)
       self.assertEqual(res, 0)
       
   def test_square_mul(self):
       res = perimeter(10, 10)
       self.assertEqual(res, 40)