import unittest
def area(a, h):
    '''
    Возвращает площадь треугольника по основанию и высоте.

    Параметры:
        a (float): длина основания
        h (float): высота, опущенная на основание

    Возвращаемое значение:
        float: площадь треугольника (a * h / 2)

    Пример вызова:
        area(6, 4)  # 12.0
    '''
    return a * h / 2


def perimeter(a, b, c):
    '''
    Возвращает периметр треугольника.

    Параметры:
        a (float): длина первой стороны
        b (float): длина второй стороны
        c (float): длина третьей стороны

    Возвращаемое значение:
        float: периметр треугольника (a + b + c)

    Пример вызова:
        perimeter(3, 4, 5)  # 12
    '''
    return a + b + c
class TriangleTestCase(unittest.TestCase):
   def test_zero_mul(self):
       res = area(10, 5)
       self.assertEqual(res, 25)
       
   def test_square_mul(self):
       res = perimeter(3, 4, 5)
       self.assertEqual(res, 12)